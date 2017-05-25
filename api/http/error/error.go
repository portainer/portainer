package error

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// errorResponse is a generic response for sending a error.
type errorResponse struct {
	Err string `json:"err,omitempty"`
}

// WriteErrorResponse writes an error message to the response and logger.
func WriteErrorResponse(w http.ResponseWriter, err error, code int, logger *log.Logger) {
	if logger != nil {
		logger.Printf("http error: %s (code=%d)", err, code)
	}

	w.WriteHeader(code)
	json.NewEncoder(w).Encode(&errorResponse{Err: err.Error()})
}

// WriteMethodNotAllowedResponse writes an error message to the response and sets the Allow header.
func WriteMethodNotAllowedResponse(w http.ResponseWriter, allowedMethods []string) {
	w.Header().Set("Allow", strings.Join(allowedMethods, ", "))
	w.WriteHeader(http.StatusMethodNotAllowed)
	json.NewEncoder(w).Encode(&errorResponse{Err: http.StatusText(http.StatusMethodNotAllowed)})
}
