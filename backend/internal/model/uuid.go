package model

import "github.com/google/uuid"

// NewUUID generates a UUID v7 (time-ordered)
func NewUUID() uuid.UUID {
	return uuid.Must(uuid.NewV7())
}
