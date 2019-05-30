package motd

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/http/client"
)

type motdResponse struct {
	Title         string            `json:"Title"`
	Message       string            `json:"Message"`
	ContentLayout map[string]string `json:"ContentLayout"`
	Style         string            `json:"Style"`
	Hash          []byte            `json:"Hash"`
}

type motdData struct {
	Title         string            `json:"title"`
	Message       []string          `json:"message"`
	ContentLayout map[string]string `json:"contentLayout"`
	Style         string            `json:"style"`
}

func (handler *Handler) motd(w http.ResponseWriter, r *http.Request) {

	motd, err := client.Get(portainer.MessageOfTheDayURL, 0)
	if err != nil {
		log.Println(err)
		response.JSON(w, &motdResponse{Message: ""})
		return
	}

	var data motdData
	err = json.Unmarshal(motd, &data)
	if err != nil {
		log.Println(err)
		response.JSON(w, &motdResponse{Message: ""})
		return
	}

	//return json.NewDecoder(r.Body).Deco
	// de(target)

	//title, err := client.Get(portainer.MessageOfTheDayTitleURL, 0)
	//if err != nil {
	//	response.JSON(w, &motdResponse{Message: ""})
	//	return
	//}

	hash := crypto.HashFromBytes(motd)
	response.JSON(w, &motdResponse{Title: data.Title, Message: strings.Join(data.Message, "\n"), Hash: hash, ContentLayout: data.ContentLayout, Style: data.Style})
}
