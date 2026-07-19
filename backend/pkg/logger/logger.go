package logger

import (
	"context"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

type Logger struct {
	zap *zap.Logger
}

type ctxKey struct{}

var defaultLogger *Logger

func init() {
	defaultLogger = New(os.Getenv("ENV") == "production")
}

func New(production bool) *Logger {
	var cfg zap.Config
	if production {
		cfg = zap.NewProductionConfig()
		cfg.EncoderConfig.TimeKey = "ts"
		cfg.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	} else {
		cfg = zap.NewDevelopmentConfig()
		cfg.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	z, err := cfg.Build(zap.AddCallerSkip(1))
	if err != nil {
		panic(err)
	}

	return &Logger{zap: z}
}

func Default() *Logger {
	return defaultLogger
}

func SetDefault(l *Logger) {
	defaultLogger = l
}

func WithContext(ctx context.Context, l *Logger) context.Context {
	return context.WithValue(ctx, ctxKey{}, l)
}

func FromContext(ctx context.Context) *Logger {
	if l, ok := ctx.Value(ctxKey{}).(*Logger); ok {
		return l
	}
	return defaultLogger
}

func (l *Logger) Info(ctx context.Context, msg string, keysAndValues ...any) {
	l.zap.Info(msg, toZapFields(keysAndValues)...)
}

func (l *Logger) Warn(ctx context.Context, msg string, keysAndValues ...any) {
	l.zap.Warn(msg, toZapFields(keysAndValues)...)
}

func (l *Logger) Error(ctx context.Context, msg string, keysAndValues ...any) {
	l.zap.Error(msg, toZapFields(keysAndValues)...)
}

func (l *Logger) With(keysAndValues ...any) *Logger {
	return &Logger{zap: l.zap.With(toZapFields(keysAndValues)...)}
}

func (l *Logger) Sync() error {
	return l.zap.Sync()
}

func Info(ctx context.Context, msg string, keysAndValues ...any) {
	FromContext(ctx).Info(ctx, msg, keysAndValues...)
}

func Warn(ctx context.Context, msg string, keysAndValues ...any) {
	FromContext(ctx).Warn(ctx, msg, keysAndValues...)
}

func Error(ctx context.Context, msg string, keysAndValues ...any) {
	FromContext(ctx).Error(ctx, msg, keysAndValues...)
}

func toZapFields(keysAndValues []any) []zap.Field {
	if len(keysAndValues) == 0 {
		return nil
	}

	fields := make([]zap.Field, 0, len(keysAndValues)/2)
	for i := 0; i < len(keysAndValues); i += 2 {
		if i+1 >= len(keysAndValues) {
			fields = append(fields, zap.Any("MISSING_VALUE", keysAndValues[i]))
			break
		}

		key, ok := keysAndValues[i].(string)
		if !ok {
			key = "INVALID_KEY"
		}
		fields = append(fields, zap.Any(key, keysAndValues[i+1]))
	}
	return fields
}
