package handler

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/prgilangdwi/gajianaman/internal/model"
	"github.com/prgilangdwi/gajianaman/internal/repository"
	"github.com/prgilangdwi/gajianaman/pkg/generator"
)

const (
	HeaderClientSource = "X-Client-Source"
)

type contextKey string

const (
	userContextKey   contextKey = "user"
	sourceContextKey contextKey = "source"
)

type AuthMiddleware struct {
	userRepo      *repository.UserRepository
	supabaseJWTSecret string
}

func NewAuthMiddleware(userRepo *repository.UserRepository, supabaseJWTSecret string) *AuthMiddleware {
	return &AuthMiddleware{
		userRepo:      userRepo,
		supabaseJWTSecret: supabaseJWTSecret,
	}
}

func (m *AuthMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			RespondError(w, http.StatusUnauthorized, "Missing authorization header", ErrUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			RespondError(w, http.StatusUnauthorized, "Invalid authorization header format", ErrUnauthorized)
			return
		}

		tokenString := parts[1]

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(m.supabaseJWTSecret), nil
		})

		if err != nil || !token.Valid {
			RespondError(w, http.StatusUnauthorized, "Invalid token", ErrUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			RespondError(w, http.StatusUnauthorized, "Invalid token claims", ErrUnauthorized)
			return
		}

		sub, ok := claims["sub"].(string)
		if !ok {
			RespondError(w, http.StatusUnauthorized, "Missing sub claim", ErrUnauthorized)
			return
		}

		userID, err := generator.ParseUUID(sub)
		if err != nil {
			RespondError(w, http.StatusUnauthorized, "Invalid user ID in token", ErrUnauthorized)
			return
		}

		user, err := m.userRepo.GetByID(r.Context(), userID)
		if err != nil || user == nil {
			RespondError(w, http.StatusUnauthorized, "User not found", ErrUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userContextKey, user)

		// Extract client source from header
		source := parseClientSource(r.Header.Get(HeaderClientSource))
		ctx = context.WithValue(ctx, sourceContextKey, source)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetUserFromContext(ctx context.Context) *model.User {
	user, _ := ctx.Value(userContextKey).(*model.User)
	return user
}

func GetSourceFromContext(ctx context.Context) model.TxSource {
	source, ok := ctx.Value(sourceContextKey).(model.TxSource)
	if !ok {
		return model.SourceWeb
	}
	return source
}

func parseClientSource(header string) model.TxSource {
	switch strings.ToLower(header) {
	case "telegram":
		return model.SourceTelegram
	case "import":
		return model.SourceImport
	default:
		return model.SourceWeb
	}
}

func CORSMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			allowed := false
			for _, o := range allowedOrigins {
				if o == "*" || o == origin {
					allowed = true
					break
				}
			}

			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				w.Header().Set("Access-Control-Allow-Credentials", "true")
			}

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
