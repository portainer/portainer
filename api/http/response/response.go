package response

import (
	"encoding/json"
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
)

// JSON encodes data to rw in JSON format. Returns a pointer to a
// HandlerError if encoding fails.
func JSON(rw http.ResponseWriter, data interface{}) *httperror.HandlerError {
	rw.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(rw).Encode(data)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to write JSON response", err}
	}
	return nil
}

// Empty merely sets the response code to NoContent (204).
func Empty(rw http.ResponseWriter) *httperror.HandlerError {
	rw.WriteHeader(http.StatusNoContent)
	return nil
}

// TODO: remove, useless now

// Bytes write data into rw. It also allows to set the Content-Type header.
func Bytes(rw http.ResponseWriter, data []byte, contentType string) *httperror.HandlerError {
	rw.Header().Set("Content-Type", contentType)
	rw.Write(data)
	return nil
}
