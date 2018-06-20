package error

import (
	"encoding/json"
	"log"
	"net/http"
)

type (
	// LoggerHandler defines a HTTP handler that includes a HandlerError return pointer
	LoggerHandler func(http.ResponseWriter, *http.Request) *HandlerError
	// HandlerError represents an error raised inside a HTTP handler
	HandlerError struct {
		StatusCode int
		Message    string
		Err        error
	}
	errorResponse struct {
		Err string `json:"err,omitempty"`
	}
)

func (handler LoggerHandler) ServeHTTP(rw http.ResponseWriter, r *http.Request) {
	err := handler(rw, r)
	if err != nil {
		writeErrorResponse(rw, err)
	}
}

func writeErrorResponse(rw http.ResponseWriter, err *HandlerError) {
	log.Printf("http error: %s (err=%s) (code=%d)\n", err.Message, err.Err, err.StatusCode)
	rw.Header().Set("Content-Type", "application/json")
	rw.WriteHeader(err.StatusCode)
	json.NewEncoder(rw).Encode(&errorResponse{Err: err.Message})
}

// WriteError is a convenience function that creates a new HandlerError before calling writeErrorResponse.
// For use outside of the standard http handlers.
func WriteError(rw http.ResponseWriter, code int, message string, err error) {
	writeErrorResponse(rw, &HandlerError{code, message, err})
}
