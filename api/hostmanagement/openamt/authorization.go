package openamt

import (
	"bytes"
	"fmt"
	"io"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"

	"github.com/segmentio/encoding/json"
)

type authenticationResponse struct {
	Token string `json:"token"`
}

func (service *Service) Authorization(configuration portainer.OpenAMTConfiguration) (string, error) {
	loginURL := fmt.Sprintf("https://%s/mps/login/api/v1/authorize", configuration.MPSServer)

	payload := map[string]string{
		"username": configuration.MPSUser,
		"password": configuration.MPSPassword,
	}
	jsonValue, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost, loginURL, bytes.NewBuffer(jsonValue))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	response, err := service.httpsClient.Do(req)
	if err != nil {
		return "", err
	}
	defer func() {
		if err := response.Body.Close(); err != nil {
			log.Warn().Err(err).Msg("failed to close response body")
		}
	}()

	responseBody, readErr := io.ReadAll(response.Body)
	if readErr != nil {
		return "", readErr
	}

	errorResponse := parseError(responseBody)
	if errorResponse != nil {
		return "", errorResponse
	}

	var token authenticationResponse
	if err := json.Unmarshal(responseBody, &token); err != nil {
		return "", err
	}

	return token.Token, nil
}
