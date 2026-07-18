package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/repository"
)

var (
	ErrTransactionNotFound = errors.New("transaction not found")
	ErrInvalidAccount      = errors.New("invalid account")
	ErrInvalidCategory     = errors.New("invalid category")
)

type TransactionService struct {
	txRepo       *repository.TransactionRepository
	accountRepo  *repository.AccountRepository
	categoryRepo *repository.CategoryRepository
}

func NewTransactionService(
	txRepo *repository.TransactionRepository,
	accountRepo *repository.AccountRepository,
	categoryRepo *repository.CategoryRepository,
) *TransactionService {
	return &TransactionService{
		txRepo:       txRepo,
		accountRepo:  accountRepo,
		categoryRepo: categoryRepo,
	}
}

type CreateTransactionParams struct {
	UserID       uuid.UUID
	AccountID    uuid.UUID
	CategoryID   uuid.UUID
	GoalID       uuid.NullUUID
	Amount       float64
	Type         model.TransactionType
	Note         string
	Date         time.Time
	Source       model.TxSource
	AIConfidence *float64
}

func (s *TransactionService) Create(ctx context.Context, p CreateTransactionParams) (*model.Transaction, error) {
	acc, err := s.accountRepo.GetByID(ctx, p.AccountID)
	if err != nil {
		return nil, err
	}
	if acc == nil || acc.UserID != p.UserID {
		return nil, ErrInvalidAccount
	}

	cat, err := s.categoryRepo.GetByID(ctx, p.CategoryID)
	if err != nil {
		return nil, err
	}
	if cat == nil {
		return nil, ErrInvalidCategory
	}

	repoParams := repository.CreateTransactionParams{
		UserID:       p.UserID,
		AccountID:    p.AccountID,
		CategoryID:   p.CategoryID,
		GoalID:       p.GoalID,
		Amount:       p.Amount,
		Type:         p.Type,
		Note:         p.Note,
		Date:         p.Date,
		Source:       p.Source,
		AIConfidence: p.AIConfidence,
	}

	tx, err := s.txRepo.Create(ctx, repoParams)
	if err != nil {
		return nil, err
	}

	delta := p.Amount
	if p.Type == model.TypeExpense {
		delta = -p.Amount
	}
	if err := s.accountRepo.UpdateBalance(ctx, p.AccountID, delta); err != nil {
		return nil, err
	}

	return tx, nil
}

func (s *TransactionService) GetByID(ctx context.Context, id uuid.UUID) (*model.Transaction, error) {
	tx, err := s.txRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if tx == nil {
		return nil, ErrTransactionNotFound
	}
	return tx, nil
}

func (s *TransactionService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	tx, err := s.txRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if tx == nil || tx.UserID != userID {
		return ErrTransactionNotFound
	}

	if err := s.txRepo.Delete(ctx, id, userID); err != nil {
		return err
	}

	delta := -tx.Amount
	if tx.Type == model.TypeExpense {
		delta = tx.Amount
	}
	return s.accountRepo.UpdateBalance(ctx, tx.AccountID, delta)
}

type UpdateTransactionParams struct {
	AccountID  *uuid.UUID
	CategoryID *uuid.UUID
	Amount     *float64
	Type       *model.TransactionType
	Note       *string
	Date       *time.Time
}

func (s *TransactionService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, p UpdateTransactionParams) (*model.Transaction, error) {
	tx, err := s.txRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if tx == nil || tx.UserID != userID {
		return nil, ErrTransactionNotFound
	}

	oldAccountID := tx.AccountID
	oldAmount := tx.Amount
	oldType := tx.Type

	if p.AccountID != nil {
		acc, err := s.accountRepo.GetByID(ctx, *p.AccountID)
		if err != nil {
			return nil, err
		}
		if acc == nil || acc.UserID != userID {
			return nil, ErrInvalidAccount
		}
		tx.AccountID = *p.AccountID
	}

	if p.CategoryID != nil {
		cat, err := s.categoryRepo.GetByID(ctx, *p.CategoryID)
		if err != nil {
			return nil, err
		}
		if cat == nil {
			return nil, ErrInvalidCategory
		}
		tx.CategoryID = *p.CategoryID
	}

	if p.Amount != nil {
		tx.Amount = *p.Amount
	}
	if p.Type != nil {
		tx.Type = *p.Type
	}
	if p.Note != nil {
		tx.Note.String = *p.Note
		tx.Note.Valid = true
	}
	if p.Date != nil {
		tx.Date = *p.Date
	}

	if err := s.txRepo.Update(ctx, tx); err != nil {
		return nil, err
	}

	oldDelta := oldAmount
	if oldType == model.TypeExpense {
		oldDelta = -oldAmount
	}
	if err := s.accountRepo.UpdateBalance(ctx, oldAccountID, -oldDelta); err != nil {
		return nil, err
	}

	newDelta := tx.Amount
	if tx.Type == model.TypeExpense {
		newDelta = -tx.Amount
	}
	if err := s.accountRepo.UpdateBalance(ctx, tx.AccountID, newDelta); err != nil {
		return nil, err
	}

	return tx, nil
}

func (s *TransactionService) ListRecent(ctx context.Context, userID uuid.UUID, limit int) ([]repository.TransactionWithCategory, error) {
	return s.txRepo.ListRecent(ctx, userID, limit)
}

func (s *TransactionService) ListByMonth(ctx context.Context, userID uuid.UUID, month, year, limit int) ([]repository.TransactionWithCategory, error) {
	return s.txRepo.ListByMonth(ctx, userID, month, year, limit)
}

func (s *TransactionService) ListByMonthPaginated(ctx context.Context, userID uuid.UUID, month, year, page, limit int) (*repository.PaginatedResult, error) {
	return s.txRepo.ListByMonthPaginated(ctx, userID, month, year, page, limit)
}

func (s *TransactionService) GetTodayStats(ctx context.Context, userID uuid.UUID) (*repository.TodayStats, error) {
	return s.txRepo.GetTodayStats(ctx, userID)
}

func (s *TransactionService) GetMonthlySummary(ctx context.Context, userID uuid.UUID, month, year int) ([]repository.CategorySummary, error) {
	return s.txRepo.GetMonthlySummary(ctx, userID, month, year)
}
