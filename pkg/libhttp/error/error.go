// Package error provides error/logging functions that can be used in conjunction with http.Handler.
package error

import (
	"errors"
	"net/http"
	"unicode"

	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
)

type (
	// LoggerHandler defines a HTTP handler that includes a HandlerError return pointer
	LoggerHandler func(http.ResponseWriter, *http.Request) *HandlerError

	errorResponse struct {
		Message string `json:"message,omitempty"`
		Details string `json:"details,omitempty"`
	}
)

func (handler LoggerHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	if err := handler(rw, r); err != nil {
		writeErrorResponse(rw, err)
	}
}

func capitalize(s string) string {
	if len(s) == 0 {
		return s
	}

	// Capitalize the first letter of the word or sentence
	firstLetter := unicode.ToUpper(rune(s[0]))

	return string(firstLetter) + s[1:]
}

func writeErrorResponse(rw http.ResponseWriter, err *HandlerError) {
	if err.Err == nil {
		err.Err = errors.New(capitalize(err.Message))
	}

	log.Debug().
		CallerSkipFrame(2).
		Err(err.Err).
		Int("status_code", err.StatusCode).
		Str("msg", err.Message).
		Msg("HTTP error")

	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(err.StatusCode)

	enc := json.NewEncoder(rw)
	enc.SetSortMapKeys(false)
	enc.SetAppendNewline(false)

	_ = enc.Encode(&errorResponse{Message: err.Message, Details: capitalize(err.Err.Error())})
}

// WriteError is a convenience function that creates a new HandlerError before calling writeErrorResponse.
// For use outside of the standard http handlers.
func WriteError(rw http.ResponseWriter, code int, message string, err error) {
	writeErrorResponse(rw, &HandlerError{code, message, err})
}
