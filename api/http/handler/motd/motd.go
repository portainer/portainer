package motd

import (
	"net/http"

	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/crypto"
	"github.com/portainer/portainer/http/client"
)

type motdResponse struct {
	Title   string `json:"Title"`
	Message string `json:"Message"`
	Hash    []byte `json:"Hash"`
}

func (handler *Handler) motd(w http.ResponseWriter, r *http.Request) {

	motd, err := client.Get(portainer.MessageOfTheDayURL, 0)
	if err != nil {
		response.JSON(w, &motdResponse{Message: ""})
		return
	}

	title, err := client.Get(portainer.MessageOfTheDayTitleURL, 0)
	if err != nil {
		response.JSON(w, &motdResponse{Message: ""})
		return
	}

	hash := crypto.HashFromBytes(motd)
	response.JSON(w, &motdResponse{Title: string(title), Message: string(motd), Hash: hash})
}
