package motd

import (
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/client"
	"github.com/portainer/portainer/pkg/libcrypto"
	libclient "github.com/portainer/portainer/pkg/libhttp/client"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"

	"github.com/segmentio/encoding/json"
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

// @id MOTD
// @summary fetches the message of the day
// @description **Access policy**: restricted
// @tags motd
// @security ApiKeyAuth
// @security jwt
// @produce json
// @success 200 {object} motdResponse
// @router /motd [get]
func (handler *Handler) motd(w http.ResponseWriter, r *http.Request) {
	if err := libclient.ExternalRequestDisabled(portainer.MessageOfTheDayURL); err != nil {
		log.Debug().Err(err).Msg("External request disabled: MOTD")
		response.JSON(w, &motdResponse{Message: ""})
		return
	}

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
