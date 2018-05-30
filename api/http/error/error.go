package error

import (
	"encoding/json"
	"log"
	"net/http"
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

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(&errorResponse{Err: err.Error()})
}
