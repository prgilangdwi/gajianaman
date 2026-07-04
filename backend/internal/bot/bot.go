package bot

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/parser"
	"github.com/prgilangdwi/gajianaman/internal/repository"
	"github.com/prgilangdwi/gajianaman/internal/service"
)

type Bot struct {
	api         *tgbotapi.BotAPI
	db          *sqlx.DB
	categorizer service.TransactionCategorizer

	userRepo     *repository.UserRepository
	accountRepo  *repository.AccountRepository
	categoryRepo *repository.CategoryRepository
	txRepo       *repository.TransactionRepository
	budgetRepo   *repository.BudgetRepository
	goalRepo     *repository.GoalRepository

	// Session state per user (telegram_id -> state)
	userState map[int64]*UserState
}

type UserState struct {
	LastTxID       uuid.UUID
	Awaiting       string
	PendingPhotoTx *PendingPhotoTx
}

type PendingPhotoTx struct {
	Amount       float64
	CategoryCode string
	Type         model.TransactionType
	Note         string
	Confidence   float64
}

func New(token string, db *sqlx.DB, categorizer service.TransactionCategorizer) (*Bot, error) {
	api, err := tgbotapi.NewBotAPI(token)
	if err != nil {
		return nil, fmt.Errorf("failed to create bot: %w", err)
	}

	api.Debug = false

	return &Bot{
		api:          api,
		db:           db,
		categorizer:  categorizer,
		userRepo:     repository.NewUserRepository(db),
		accountRepo:  repository.NewAccountRepository(db),
		categoryRepo: repository.NewCategoryRepository(db),
		txRepo:       repository.NewTransactionRepository(db),
		budgetRepo:   repository.NewBudgetRepository(db),
		goalRepo:     repository.NewGoalRepository(db),
		userState:    make(map[int64]*UserState),
	}, nil
}

func (b *Bot) Start(ctx context.Context) error {
	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60

	updates := b.api.GetUpdatesChan(u)
	log.Printf("Bot @%s started", b.api.Self.UserName)

	for {
		select {
		case <-ctx.Done():
			return nil
		case update := <-updates:
			go b.handleUpdate(ctx, update)
		}
	}
}

func (b *Bot) handleUpdate(ctx context.Context, update tgbotapi.Update) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic: %v", r)
		}
	}()

	if update.CallbackQuery != nil {
		b.handleCallback(ctx, update.CallbackQuery)
		return
	}

	if update.Message == nil {
		return
	}

	if update.Message.Photo != nil {
		b.handlePhoto(ctx, update.Message)
		return
	}

	if update.Message.IsCommand() {
		b.handleCommand(ctx, update.Message)
		return
	}

	b.handleMessage(ctx, update.Message)
}

func (b *Bot) handleCommand(ctx context.Context, msg *tgbotapi.Message) {
	switch msg.Command() {
	case "start":
		b.cmdStart(ctx, msg)
	case "add":
		b.cmdAdd(ctx, msg)
	case "income":
		b.cmdIncome(ctx, msg)
	case "summary":
		b.cmdSummary(ctx, msg)
	case "history":
		b.cmdHistory(ctx, msg)
	case "budget":
		b.cmdBudget(ctx, msg)
	case "goal":
		b.cmdGoal(ctx, msg)
	case "delete":
		b.cmdDelete(ctx, msg)
	case "stats":
		b.cmdStats(ctx, msg)
	case "help":
		b.cmdHelp(ctx, msg)
	case "commands":
		b.cmdCommands(ctx, msg)
	case "cancel":
		b.cmdCancel(ctx, msg)
	default:
		b.reply(msg.Chat.ID, "❓ Command tidak dikenali. Ketik /help untuk bantuan.")
	}
}

func (b *Bot) getUserState(telegramID int64) *UserState {
	if b.userState[telegramID] == nil {
		b.userState[telegramID] = &UserState{}
	}
	return b.userState[telegramID]
}

func (b *Bot) reply(chatID int64, text string) {
	msg := tgbotapi.NewMessage(chatID, text)
	msg.ParseMode = "Markdown"
	b.api.Send(msg)
}

func (b *Bot) replyWithKeyboard(chatID int64, text string, keyboard tgbotapi.InlineKeyboardMarkup) {
	msg := tgbotapi.NewMessage(chatID, text)
	msg.ParseMode = "Markdown"
	msg.ReplyMarkup = keyboard
	b.api.Send(msg)
}

func (b *Bot) editMessage(chatID int64, msgID int, text string, keyboard *tgbotapi.InlineKeyboardMarkup) {
	edit := tgbotapi.NewEditMessageText(chatID, msgID, text)
	edit.ParseMode = "Markdown"
	if keyboard != nil {
		edit.ReplyMarkup = keyboard
	}
	b.api.Send(edit)
}

func (b *Bot) answerCallback(callbackID string) {
	b.api.Request(tgbotapi.NewCallback(callbackID, ""))
}

func (b *Bot) ensureUser(ctx context.Context, tgUser *tgbotapi.User) (*model.User, error) {
	telegramID := strconv.FormatInt(tgUser.ID, 10)
	user, err := b.userRepo.EnsureUser(ctx, telegramID, tgUser.FirstName)
	if err != nil {
		return nil, err
	}

	// Ensure default account exists
	_, err = b.accountRepo.EnsureDefault(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (b *Bot) getUser(ctx context.Context, telegramID int64) (*model.User, error) {
	return b.userRepo.GetByTelegramID(ctx, strconv.FormatInt(telegramID, 10))
}

func (b *Bot) requireUser(ctx context.Context, msg *tgbotapi.Message) (*model.User, bool) {
	user, err := b.getUser(ctx, msg.From.ID)
	if err != nil {
		log.Printf("Error getting user: %v", err)
		b.reply(msg.Chat.ID, "⚠️ Terjadi kesalahan. Coba lagi.")
		return nil, false
	}
	if user == nil {
		b.reply(msg.Chat.ID, "👋 Halo! Kamu belum terdaftar.\nKetik /start untuk mendaftar dan mulai mencatat keuanganmu! 💰")
		return nil, false
	}
	return user, true
}

// resolveCategoryID looks up category by code or name and returns its UUID
func (b *Bot) resolveCategoryID(ctx context.Context, userID uuid.UUID, categoryCodeOrName string, txType model.TransactionType) (uuid.UUID, error) {
	// First try as code (uppercase with underscores)
	cat, err := b.categoryRepo.GetByCode(ctx, userID, categoryCodeOrName, txType)
	if err != nil {
		return uuid.Nil, err
	}
	if cat != nil {
		return cat.ID, nil
	}

	// Try code with any type
	cat, err = b.categoryRepo.GetByCodeAnyType(ctx, userID, categoryCodeOrName)
	if err != nil {
		return uuid.Nil, err
	}
	if cat != nil {
		return cat.ID, nil
	}

	// Fall back to name lookup (converts name to code internally)
	cat, err = b.categoryRepo.GetByName(ctx, userID, categoryCodeOrName, txType)
	if err != nil {
		return uuid.Nil, err
	}
	if cat != nil {
		return cat.ID, nil
	}

	// Fallback to "Other"
	other, err := b.categoryRepo.GetOtherCategory(ctx, txType)
	if err != nil {
		return uuid.Nil, err
	}
	if other != nil {
		return other.ID, nil
	}

	return uuid.Nil, fmt.Errorf("no category found for %s", categoryCodeOrName)
}

func (b *Bot) createTransaction(ctx context.Context, user *model.User, amount float64, txType model.TransactionType, categoryName, note string, txDate time.Time, confidence float64) (*model.Transaction, error) {
	account, err := b.accountRepo.GetDefault(ctx, user.ID)
	if err != nil {
		return nil, err
	}
	if account == nil {
		account, err = b.accountRepo.EnsureDefault(ctx, user.ID)
		if err != nil {
			return nil, err
		}
	}

	categoryID, err := b.resolveCategoryID(ctx, user.ID, categoryName, txType)
	if err != nil {
		return nil, err
	}

	params := repository.CreateTransactionParams{
		UserID:       user.ID,
		AccountID:    account.ID,
		CategoryID:   categoryID,
		Amount:       amount,
		Type:         txType,
		Note:         note,
		Date:         txDate,
		Source:       model.SourceTelegram,
		AIConfidence: &confidence,
	}

	tx, err := b.txRepo.Create(ctx, params)
	if err != nil {
		return nil, err
	}

	// Update account balance
	delta := amount
	if txType == model.TypeExpense {
		delta = -amount
	}
	if err := b.accountRepo.UpdateBalance(ctx, account.ID, delta); err != nil {
		log.Printf("Warning: failed to update account balance: %v", err)
	}

	return tx, nil
}

func (b *Bot) checkBudgetAlert(ctx context.Context, msg *tgbotapi.Message, user *model.User, categoryID uuid.UUID) {
	now := time.Now()
	alert, err := b.budgetRepo.CheckAlert(ctx, user.ID, categoryID, int(now.Month()), now.Year())
	if err != nil || alert == nil || alert.Budget <= 0 {
		return
	}

	cat, _ := b.categoryRepo.GetByID(ctx, categoryID)
	catName := "Unknown"
	if cat != nil {
		catName = cat.Name
	}

	alertMsg := service.GetBudgetAlertMessage(catName, alert.Budget, alert.Actual)
	if alertMsg != "" {
		b.reply(msg.Chat.ID, alertMsg)
	}
}

func (b *Bot) sendStreakMessage(ctx context.Context, msg *tgbotapi.Message, userID uuid.UUID) {
	count, err := b.txRepo.GetHourlyCount(ctx, userID)
	if err != nil {
		return
	}
	streakMsg := service.GetStreakMessage(count)
	if streakMsg != "" {
		b.reply(msg.Chat.ID, streakMsg)
	}
}

// parseCommandArgs parses "/cmd amount note" format
func parseCommandArgs(text string) (amount float64, note string, ok bool) {
	parts := splitCommand(text)
	if len(parts) < 3 {
		return 0, "", false
	}
	amount, ok = parser.ParseAmount(parts[1])
	if !ok || amount <= 0 {
		return 0, "", false
	}
	note = joinFrom(parts, 2)
	return amount, note, true
}

func splitCommand(text string) []string {
	var parts []string
	var current string
	for _, r := range text {
		if r == ' ' {
			if current != "" {
				parts = append(parts, current)
				current = ""
			}
		} else {
			current += string(r)
		}
	}
	if current != "" {
		parts = append(parts, current)
	}
	return parts
}

func joinFrom(parts []string, start int) string {
	if start >= len(parts) {
		return ""
	}
	result := parts[start]
	for i := start + 1; i < len(parts); i++ {
		result += " " + parts[i]
	}
	return result
}
