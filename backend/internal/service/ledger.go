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
	ErrLedgerNotFound = errors.New("ledger entry not found")
)

type LedgerService struct {
	ledgerRepo  *repository.LedgerRepository
	accountRepo *repository.AccountRepository
}

func NewLedgerService(ledgerRepo *repository.LedgerRepository, accountRepo *repository.AccountRepository) *LedgerService {
	return &LedgerService{
		ledgerRepo:  ledgerRepo,
		accountRepo: accountRepo,
	}
}

type ListLedgerParams struct {
	UserID    uuid.UUID
	AccountID *uuid.UUID
	StartDate *time.Time
	EndDate   *time.Time
	Page      int
	Limit     int
}

func (s *LedgerService) List(ctx context.Context, p ListLedgerParams) (*repository.LedgerPaginatedResult, error) {
	// If account_id is provided, verify ownership
	if p.AccountID != nil {
		acc, err := s.accountRepo.GetByID(ctx, *p.AccountID)
		if err != nil {
			return nil, err
		}
		if acc == nil || acc.UserID != p.UserID {
			return &repository.LedgerPaginatedResult{Items: []model.LedgerEntry{}, Total: 0}, nil
		}
	}

	filter := repository.ListLedgerFilter{
		UserID:    p.UserID,
		AccountID: p.AccountID,
		StartDate: p.StartDate,
		EndDate:   p.EndDate,
		Page:      p.Page,
		Limit:     p.Limit,
	}

	return s.ledgerRepo.ListFiltered(ctx, filter)
}

func (s *LedgerService) GetByID(ctx context.Context, id, userID uuid.UUID) (*model.LedgerEntry, error) {
	entry, err := s.ledgerRepo.GetByIDForUser(ctx, id, userID)
	if err != nil {
		return nil, err
	}
	if entry == nil {
		return nil, ErrLedgerNotFound
	}
	return entry, nil
}
