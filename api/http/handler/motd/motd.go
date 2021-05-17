package motd

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/portainer/libcrypto"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
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

// @summary fetches the message of the day
// @tags motd
// @security jwt
// @produce json
// @success 200 {object} motdResponse
// @router /motd [get]
func (handler *Handler) motd(w http.ResponseWriter, r *http.Request) {
	motd, err := client.Get(portainer.MessageOfTheDayURL, 0)
	if err != nil {
		response.JSON(w, &motdResponse{Message: ""})
		return
	}

	var data motdData
	err = json.Unmarshal(motd, &data)
	if err != nil {
		response.JSON(w, &motdResponse{Message: ""})
		return
	}

	message := strings.Join(data.Message, "\n")

	hash := libcrypto.HashFromBytes([]byte(message))
	resp := motdResponse{
		Title:         data.Title,
		Message:       message,
		Hash:          hash,
		ContentLayout: data.ContentLayout,
		Style:         data.Style,
	}

	response.JSON(w, &resp)
}
