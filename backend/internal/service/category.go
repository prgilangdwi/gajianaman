package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/repository"
)

type CategoryService struct {
	categoryRepo *repository.CategoryRepository
}

func NewCategoryService(categoryRepo *repository.CategoryRepository) *CategoryService {
	return &CategoryService{categoryRepo: categoryRepo}
}

func (s *CategoryService) ListForUser(ctx context.Context, userID uuid.UUID, txType *model.TransactionType) ([]model.Category, error) {
	return s.categoryRepo.ListForUser(ctx, userID, txType)
}

func (s *CategoryService) GetByID(ctx context.Context, id uuid.UUID) (*model.Category, error) {
	return s.categoryRepo.GetByID(ctx, id)
}
