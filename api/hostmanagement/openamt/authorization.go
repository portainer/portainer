package openamt

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type authenticationResponse struct {
	Token string `json:"token"`
}

func (service *Service) executeAuthenticationRequest(configuration portainer.OpenAMTConfiguration) (*authenticationResponse, error) {
	loginURL := fmt.Sprintf("https://%s/mps/login/api/v1/authorize", configuration.MPSServer)

	payload := map[string]string{
		"username": configuration.Credentials.MPSUser,
		"password": configuration.Credentials.MPSPassword,
	}
	jsonValue, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost, loginURL, bytes.NewBuffer(jsonValue))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	response, err := service.httpsClient.Do(req)
	if err != nil {
		return nil, err
	}
	responseBody, readErr := ioutil.ReadAll(response.Body)
	if readErr != nil {
		return nil, readErr
	}
	errorResponse := parseError(responseBody)
	if errorResponse != nil {
		return nil, errorResponse
	}

	var token authenticationResponse
	err = json.Unmarshal(responseBody, &token)
	if err != nil {
		return nil, err
	}

	return &token, nil
}
