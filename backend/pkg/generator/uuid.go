package generator

import "github.com/google/uuid"

// NewUUID generates a UUID v7 (time-ordered)
func NewUUID() uuid.UUID {
	return uuid.Must(uuid.NewV7())
}

// ParseUUID parses a UUID string
func ParseUUID(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}

// MustParseUUID parses a UUID string, panics on error
func MustParseUUID(s string) uuid.UUID {
	return uuid.MustParse(s)
}
