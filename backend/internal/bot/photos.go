package bot

import (
	"context"
	"encoding/base64"
	"io"
	"net/http"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/prgilangdwi/gajianaman/internal/model"
)

func (b *Bot) handlePhoto(ctx context.Context, msg *tgbotapi.Message) {
	user, err := b.getUser(ctx, msg.From.ID)
	if err != nil || user == nil {
		b.reply(msg.Chat.ID, "👋 Ketik /start untuk mendaftar dan mulai menggunakan Gajian Aman.")
		return
	}

	statusMsg, _ := b.api.Send(tgbotapi.NewMessage(msg.Chat.ID, "📸 Menganalisis foto...\n_Mohon tunggu sebentar._"))

	// Get the largest photo
	photos := msg.Photo
	if len(photos) == 0 {
		b.reply(msg.Chat.ID, "⚠️ Tidak ada foto yang terdeteksi.")
		return
	}
	photo := photos[len(photos)-1]

	// Download the photo
	fileConfig := tgbotapi.FileConfig{FileID: photo.FileID}
	file, err := b.api.GetFile(fileConfig)
	if err != nil {
		b.reply(msg.Chat.ID, "⚠️ Gagal mengunduh foto.")
		return
	}

	fileURL := file.Link(b.api.Token)
	resp, err := http.Get(fileURL)
	if err != nil {
		b.reply(msg.Chat.ID, "⚠️ Gagal mengunduh foto.")
		return
	}
	defer resp.Body.Close()

	photoBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		b.reply(msg.Chat.ID, "⚠️ Gagal membaca foto.")
		return
	}

	photoB64 := base64.StdEncoding.EncodeToString(photoBytes)

	// Parse image with AI (simplified - you'd integrate with Gemini here)
	// For now, we'll show a placeholder response
	result := parseImageTransaction(photoB64)

	if result.Error != "" {
		b.editMessage(msg.Chat.ID, statusMsg.MessageID, "❌ *Gagal membaca foto*\n\n"+result.Error+"\n\nPastikan foto menampilkan struk atau bukti transfer yang jelas.", nil)
		return
	}

	// Store pending photo transaction
	state := b.getUserState(msg.From.ID)
	state.PendingPhotoTx = &PendingPhotoTx{
		Amount:       result.Amount,
		CategoryCode: result.CategoryCode,
		Type:         result.Type,
		Note:         result.Note,
		Confidence:   result.Confidence,
	}

	confText := buildPhotoConfirmText(state.PendingPhotoTx)
	kb := photoConfirmKeyboard()
	b.editMessage(msg.Chat.ID, statusMsg.MessageID, confText, &kb)
}

type ImageParseResult struct {
	Amount       float64
	CategoryCode string
	Type         model.TransactionType
	Note         string
	Confidence   float64
	Error        string
}

func parseImageTransaction(imageB64 string) ImageParseResult {
	// TODO: Integrate with Gemini Flash for image parsing
	// For now, return a placeholder that asks user to use text input
	return ImageParseResult{
		Error: "Fitur scan foto masih dalam pengembangan. Silakan input manual dengan mengetik:\n`beli [item] [harga]`",
	}
}
