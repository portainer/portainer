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

		if err := response.JSON(w, &motdResponse{Message: ""}); err != nil {
			log.Warn().Err(err).Msg("failed to send MOTD response")
		}

		return
	}

	motd, err := client.Get(portainer.MessageOfTheDayURL, 0)
	if err != nil {
		if err := response.JSON(w, &motdResponse{Message: ""}); err != nil {
			log.Error().Err(err).Msg("failed to send MOTD response")
		}

		return
	}

	var data motdData
	if err := json.Unmarshal(motd, &data); err != nil {
		if err := response.JSON(w, &motdResponse{Message: ""}); err != nil {
			log.Error().Err(err).Msg("failed to send MOTD response")
		}

		return
	}

	message := strings.Join(data.Message, "\n")

	hash := libcrypto.InsecureHashFromBytes([]byte(message))
	resp := motdResponse{
		Title:         data.Title,
		Message:       message,
		Hash:          hash,
		ContentLayout: data.ContentLayout,
		Style:         data.Style,
	}

	if err := response.JSON(w, &resp); err != nil {
		log.Warn().Err(err).Msg("failed to send MOTD response")
	}
}
