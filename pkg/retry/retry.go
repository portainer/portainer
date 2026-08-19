package retry

import (
	"math/rand/v2"
	"time"

	"github.com/rs/zerolog/log"
)

type Settings struct {
	MaxRetries    int
	RetryTimeFunc func(failures int) time.Duration
}

var Default = Settings{
	MaxRetries:    3,
	RetryTimeFunc: RetryTime,
}

// RetryWithWarnings executes a function with retries and backoff, logging warnings on failures
func RetryWithWarnings[T any](operation string, settings Settings, fn func() (T, error)) (T, error) {
	timeStart := time.Now()

	var result T
	var err error

	for attempt := 1; attempt <= settings.MaxRetries; attempt++ {
		result, err = fn()
		if err == nil {
			if attempt > 1 {
				log.Info().
					Str("operation", operation).
					Int("attempt", attempt).
					Str("duration", time.Since(timeStart).String()).
					Msg("operation succeeded after retry")
			}
			return result, nil
		}

		if attempt < settings.MaxRetries {
			retryDelay := settings.RetryTimeFunc(attempt)
			log.Warn().
				Err(err).
				Str("operation", operation).
				Int("attempt", attempt).
				Int("max_retries", settings.MaxRetries).
				Str("retry_delay", retryDelay.String()). // the string version of the duration reads better in logs
				Str("duration", time.Since(timeStart).String()).
				Msg("operation failed, retrying")
			time.Sleep(retryDelay)
		}
	}

	log.Error().
		Err(err).
		Str("operation", operation).
		Int("attempts", settings.MaxRetries).
		Str("duration", time.Since(timeStart).String()).
		Msg("operation failed after all retries")

	return result, err
}

func RetryTime(failures int) time.Duration {
	var baseTime time.Duration

	switch failures {
	case 0, 1:
		baseTime = 5 * time.Second
	case 2:
		baseTime = 30 * time.Second
	default:
		baseTime = 90 * time.Second
	}

	// plus random jitter
	jitter := time.Duration(rand.Int64N(int64(10 * time.Second))) // 10s as nanoseconds overflows int on 32bit systems

	return baseTime + jitter
}
