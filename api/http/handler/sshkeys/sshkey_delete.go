package sshkeys

import (
	"net/http"

	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

// DELETE request on /api/sshkeys/:id
func (handler *Handler) sshkeyDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	id, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid sshkey identifier route variable", err}
	}

	err = handler.SshkeyService.DeleteSshkey(portainer.SshkeyID(id))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove the sshkey from the database", err}
	}

	return response.Empty(w)
}
