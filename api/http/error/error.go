package error

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/portainer/portainer"
)

const (
	// TODO: check if still used
	// ErrInvalidJSON defines an error raised the app is unable to parse request data
	ErrInvalidJSON = portainer.Error("Invalid JSON")

	// TODO: check if still used
	// ErrInvalidRequestFormat defines an error raised when the format of the data sent in a request is not valid
	ErrInvalidRequestFormat = portainer.Error("Invalid request data format")

	// TODO: check if still used
	// ErrInvalidQueryFormat defines an error raised when the data sent in the query or the URL is invalid
	ErrInvalidQueryFormat = portainer.Error("Invalid query format")
	// ErrInvalidQueryParameter defines an error raised when a mandatory query parameter has an invalid value.
	ErrInvalidQueryParameter = portainer.Error("Invalid query parameter")
	// ErrMissingQueryParameter defines an error raised when a mandatory query parameter is missing.
	ErrMissingQueryParameter = portainer.Error("Missing query parameter")
	// ErrMissingFormDataValue defines an error raised when a mandatory form data value is missing.
	ErrMissingFormDataValue = portainer.Error("Missing form data value")
)

type (
	// LoggerHandler defines a HTTP handler that includes a HandlerError return pointer
	LoggerHandler func(http.ResponseWriter, *http.Request) *HandlerError
	// HandlerError represents an error raised inside a HTTP handler
	HandlerError struct {
		Err        error
		Message    string
		StatusCode int
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

// WriteErrorResponse writes an error message to the response and logger.
// TODO: should be removed
func WriteErrorResponse(w http.ResponseWriter, err error, code int, logger *log.Logger) {
	if logger != nil {
		logger.Printf("http error: %s (code=%d)", err, code)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(&errorResponse{Err: err.Error()})
}
