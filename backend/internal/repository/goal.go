package repository

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/pkg/utils"
)

type GoalRepository struct {
	db *sqlx.DB
}

func NewGoalRepository(db *sqlx.DB) *GoalRepository {
	return &GoalRepository{db: db}
}

func (r *GoalRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Goal, error) {
	var g model.Goal
	err := r.db.GetContext(ctx, &g,
		`SELECT id, user_id, name, target_amount, deadline, created_at, updated_at, deleted_at
		 FROM goals WHERE id = $1 AND deleted_at IS NULL`, id.String())
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	// Denormalize amount
	g.TargetAmount = utils.Denormalize(int64(g.TargetAmount))
	return &g, nil
}

func (r *GoalRepository) ListByUser(ctx context.Context, userID uuid.UUID) ([]model.Goal, error) {
	var goals []model.Goal
	err := r.db.SelectContext(ctx, &goals,
		`SELECT id, user_id, name, target_amount, deadline, created_at, updated_at, deleted_at
		 FROM goals WHERE user_id = $1 AND deleted_at IS NULL
		 ORDER BY created_at DESC`, userID.String())
	// Denormalize amounts
	for i := range goals {
		goals[i].TargetAmount = utils.Denormalize(int64(goals[i].TargetAmount))
	}
	return goals, err
}

func (r *GoalRepository) Create(ctx context.Context, userID uuid.UUID, name string, target float64) (*model.Goal, error) {
	id := uuid.New()
	// Normalize amount for storage
	normalizedTarget := utils.Normalize(target)
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO goals (id, user_id, name, target_amount)
		 VALUES ($1, $2, $3, $4)`,
		id.String(), userID.String(), name, normalizedTarget)
	if err != nil {
		return nil, err
	}
	return r.GetByID(ctx, id)
}

// GetSavedAmount calculates the total saved toward a goal from transactions
func (r *GoalRepository) GetSavedAmount(ctx context.Context, goalID uuid.UUID) (float64, error) {
	var total float64
	err := r.db.GetContext(ctx, &total,
		`SELECT COALESCE(SUM(amount), 0)
		 FROM transactions
		 WHERE goal_id = $1 AND deleted_at IS NULL`, goalID.String())
	// Denormalize amount
	return utils.Denormalize(int64(total)), err
}

type GoalWithProgress struct {
	model.Goal
	SavedAmount float64 `db:"saved_amount"`
}

func (r *GoalRepository) ListWithProgress(ctx context.Context, userID uuid.UUID) ([]GoalWithProgress, error) {
	var goals []GoalWithProgress
	err := r.db.SelectContext(ctx, &goals,
		`SELECT g.id, g.user_id, g.name, g.target_amount, g.deadline, g.created_at, g.updated_at, g.deleted_at,
		        COALESCE(SUM(t.amount), 0) as saved_amount
		 FROM goals g
		 LEFT JOIN transactions t ON t.goal_id = g.id AND t.deleted_at IS NULL
		 WHERE g.user_id = $1 AND g.deleted_at IS NULL
		 GROUP BY g.id
		 ORDER BY g.created_at DESC`, userID.String())
	// Denormalize amounts
	for i := range goals {
		goals[i].TargetAmount = utils.Denormalize(int64(goals[i].TargetAmount))
		goals[i].SavedAmount = utils.Denormalize(int64(goals[i].SavedAmount))
	}
	return goals, err
}
