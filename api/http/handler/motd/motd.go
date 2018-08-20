package motd

import (
	"net/http"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
	"github.com/portainer/portainer/http/client"
	"github.com/portainer/portainer/http/response"
)

type motdResponse struct {
	Message string `json:"Message"`
	Hash    []byte `json:"Hash"`
}

func (handler *Handler) motd(w http.ResponseWriter, r *http.Request) {

	motd, err := client.Get(portainer.MessageOfTheDayURL)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	hash := crypto.HashFromBytes(motd)
	response.JSON(w, &motdResponse{Message: string(motd), Hash: hash})
}
