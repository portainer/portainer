package response

import (
	"encoding/json"
	"log"
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
)

// TODO: remove
// EncodeJSON encodes v to w in JSON format. WriteErrorResponse() is called if encoding fails.
func EncodeJSON(w http.ResponseWriter, v interface{}, logger *log.Logger) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, logger)
	}
}

// TODO: rename ? response.WriteJSONResponse seems redondant. WriteJSON seems better?
// WriteJSONResponse encodes data to rw in JSON format. Returns a pointer to a
// HandlerError if encoding fails.
func WriteJSONResponse(rw http.ResponseWriter, data interface{}) *httperror.HandlerError {
	rw.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(rw).Encode(data)
	if err != nil {
		return &httperror.HandlerError{err, "Unable to write JSON response", http.StatusInternalServerError}
	}
	return nil
}

// TODO: rename ? response.EmptyResponse seems redondant. response.Empty() better?
// EmptyResponse merely sets the response code to NoContent (204).
func EmptyResponse(rw http.ResponseWriter) *httperror.HandlerError {
	rw.WriteHeader(http.StatusNoContent)
	return nil
}
