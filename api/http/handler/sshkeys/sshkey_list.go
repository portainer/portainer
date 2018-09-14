package sshkeys

import (
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
)

// GET request on /api/sshkeys
func (handler *Handler) sshkeyList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	sshkeys, err := handler.SshkeyService.Sshkeys()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve sshkeys from the database", err}
	}

	return response.JSON(w, sshkeys)
}
