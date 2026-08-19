package middlewares

import (
	"errors"
	"net/http"
	"runtime/debug"

	"github.com/rs/zerolog/log"
)

func WithPanicLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				// Forward the panic upstream so net/http aborts the connection
				if panicErr, ok := err.(error); ok && errors.Is(panicErr, http.ErrAbortHandler) {
					panic(err)
				}

				log.Error().
					Any("panic", err).
					Str("method", req.Method).
					Str("url", req.URL.String()).
					Str("stack", string(debug.Stack())).
					Msg("Panic in request handler")
			}
		}()

		next.ServeHTTP(w, req)
	})
}
