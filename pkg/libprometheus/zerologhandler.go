package libprometheus

import (
	"context"
	"log/slog"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// zerologHandler is a slog.Handler that bridges to zerolog, so Prometheus
// libraries (TSDB, rules.Manager) log through the application's zerolog pipeline
// instead of bypassing it via slog.Default().
//
// TODO: replace with zerolog.NewSlogHandler once a tagged release includes it
// (merged upstream in github.com/rs/zerolog#755).
type zerologHandler struct{}

func (h zerologHandler) Enabled(_ context.Context, level slog.Level) bool {
	return log.Logger.GetLevel() <= slogToZerologLevel(level)
}

func (h zerologHandler) Handle(_ context.Context, rec slog.Record) error {
	event := log.Logger.WithLevel(slogToZerologLevel(rec.Level)) //nolint:zerologlint // matches zerolog's own SlogHandler implementation (rs/zerolog#755)
	if event == nil {
		return nil
	}
	rec.Attrs(func(a slog.Attr) bool {
		event = event.Str(a.Key, a.Value.String())
		return true
	})
	event.Msg(rec.Message)
	return nil
}

func (h zerologHandler) WithAttrs(_ []slog.Attr) slog.Handler { return h }
func (h zerologHandler) WithGroup(_ string) slog.Handler      { return h }

func slogToZerologLevel(l slog.Level) zerolog.Level {
	switch {
	case l >= slog.LevelError:
		return zerolog.ErrorLevel
	case l >= slog.LevelWarn:
		return zerolog.WarnLevel
	case l >= slog.LevelInfo:
		return zerolog.InfoLevel
	default:
		return zerolog.DebugLevel
	}
}

// NewZerologSlogger returns an *slog.Logger that writes through zerolog.
func NewZerologSlogger() *slog.Logger {
	return slog.New(zerologHandler{})
}
