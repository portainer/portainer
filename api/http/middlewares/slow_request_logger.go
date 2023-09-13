package middlewares

import (
	"net/http"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func WithSlowRequestsLogger(next http.Handler) http.Handler {
	if zerolog.GlobalLevel() > zerolog.DebugLevel {
		return next
	}

	burstSampler := &zerolog.BurstSampler{
		Burst:  1,
		Period: time.Minute,
	}

	log := log.With().Logger().Sample(burstSampler)

	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		t0 := time.Now()

		next.ServeHTTP(w, req)

		if d := time.Since(t0); d > 100*time.Millisecond {
			log.Debug().
				Dur("elapsed_ms", d).
				Str("method", req.Method).
				Str("url", req.URL.String()).
				Msg("slow request")
		}
	})
}
