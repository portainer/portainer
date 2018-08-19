package motd

import (
	"net/http"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
	"github.com/portainer/portainer/http/client"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
)

type motdResponse struct {
	Message string `json:"Message"`
	Hash    []byte `json:"Hash"`
}

func (handler *Handler) motd(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	motd, err := client.Get(portainer.MessageOfTheDayURL)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve message of the day", err}
	}

	hash := crypto.HashFromBytes(motd)
	return response.JSON(w, &motdResponse{Message: string(motd), Hash: hash})
}
