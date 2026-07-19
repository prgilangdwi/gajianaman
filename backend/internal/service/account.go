package service

import (
	"context"
	"errors"
	"math"

	"github.com/google/uuid"
	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/repository"
	"github.com/prgilangdwi/gajianaman/pkg/generator"
)

var (
	ErrAccountNotFound   = errors.New("account not found")
	ErrNoAccounts        = errors.New("user has no accounts")
	ErrCannotDeleteLast  = errors.New("cannot delete last account")
	ErrAccountHasTx      = errors.New("account has transactions")
)

type AccountService struct {
	accountRepo *repository.AccountRepository
	txRepo      *repository.TransactionRepository
	ledgerRepo  *repository.LedgerRepository
}

func NewAccountService(accountRepo *repository.AccountRepository, txRepo *repository.TransactionRepository, ledgerRepo *repository.LedgerRepository) *AccountService {
	return &AccountService{
		accountRepo: accountRepo,
		txRepo:      txRepo,
		ledgerRepo:  ledgerRepo,
	}
}

type CreateAccountParams struct {
	UserID    uuid.UUID
	Name      string
	Type      model.AccountType
	Balance   float64
	IsDefault bool
}

func (s *AccountService) Create(ctx context.Context, p CreateAccountParams) (*model.Account, error) {
	accounts, err := s.accountRepo.ListByUser(ctx, p.UserID)
	if err != nil {
		return nil, err
	}

	isDefault := p.IsDefault || len(accounts) == 0

	if isDefault && len(accounts) > 0 {
		for _, acc := range accounts {
			if acc.IsDefault {
				if err := s.accountRepo.ClearDefault(ctx, p.UserID); err != nil {
					return nil, err
				}
				break
			}
		}
	}

	acc := &model.Account{
		ID:        generator.NewUUID(),
		UserID:    p.UserID,
		Name:      p.Name,
		Type:      p.Type,
		Balance:   p.Balance,
		IsDefault: isDefault,
	}

	if err := s.accountRepo.Create(ctx, acc); err != nil {
		return nil, err
	}

	// Create initial balance ledger entry if balance is non-zero
	if p.Balance != 0 {
		ledgerType := model.LedgerTypeCredit
		if p.Balance < 0 {
			ledgerType = model.LedgerTypeDebit
		}
		ledgerEntry := &model.LedgerEntry{
			AccountID:       acc.ID,
			Type:            ledgerType,
			Amount:          math.Abs(p.Balance),
			StartingBalance: 0,
			EndingBalance:   p.Balance,
		}
		if err := s.ledgerRepo.Create(ctx, ledgerEntry); err != nil {
			return nil, err
		}
	}

	return acc, nil
}

func (s *AccountService) List(ctx context.Context, userID uuid.UUID) ([]model.Account, error) {
	return s.accountRepo.ListByUser(ctx, userID)
}

func (s *AccountService) GetByID(ctx context.Context, id uuid.UUID) (*model.Account, error) {
	acc, err := s.accountRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if acc == nil {
		return nil, ErrAccountNotFound
	}
	return acc, nil
}

func (s *AccountService) GetDefault(ctx context.Context, userID uuid.UUID) (*model.Account, error) {
	return s.accountRepo.GetDefault(ctx, userID)
}

func (s *AccountService) EnsureDefault(ctx context.Context, userID uuid.UUID) (*model.Account, error) {
	return s.accountRepo.EnsureDefault(ctx, userID)
}

func (s *AccountService) HasAccounts(ctx context.Context, userID uuid.UUID) (bool, error) {
	accounts, err := s.accountRepo.ListByUser(ctx, userID)
	if err != nil {
		return false, err
	}
	return len(accounts) > 0, nil
}

type UpdateAccountParams struct {
	Name      *string
	Type      *model.AccountType
	IsDefault *bool
}

func (s *AccountService) Update(ctx context.Context, id uuid.UUID, userID uuid.UUID, p UpdateAccountParams) (*model.Account, error) {
	acc, err := s.accountRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if acc == nil || acc.UserID != userID {
		return nil, ErrAccountNotFound
	}

	if p.Name != nil {
		acc.Name = *p.Name
	}
	if p.Type != nil {
		acc.Type = *p.Type
	}
	if p.IsDefault != nil && *p.IsDefault && !acc.IsDefault {
		if err := s.accountRepo.ClearDefault(ctx, userID); err != nil {
			return nil, err
		}
		acc.IsDefault = true
	}

	if err := s.accountRepo.Update(ctx, acc); err != nil {
		return nil, err
	}

	return acc, nil
}

func (s *AccountService) Delete(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	acc, err := s.accountRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if acc == nil || acc.UserID != userID {
		return ErrAccountNotFound
	}

	accounts, err := s.accountRepo.ListByUser(ctx, userID)
	if err != nil {
		return err
	}
	if len(accounts) <= 1 {
		return ErrCannotDeleteLast
	}

	return s.accountRepo.Delete(ctx, id)
}

func (s *AccountService) UpdateBalance(ctx context.Context, id uuid.UUID, delta float64) error {
	return s.accountRepo.UpdateBalance(ctx, id, delta)
}
