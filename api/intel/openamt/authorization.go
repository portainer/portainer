package openamt

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

type authenticationResponse struct {
	Token string `json:"token"`
}

func (service *Service) executeAuthenticationRequest() (*authenticationResponse, error) {
	loginURL := fmt.Sprintf("https://%v/mps/login/api/v1/authorize", MpsServerAddress)

	payload := map[string]string{
		"username": MpsServerAdminUser,
		"password": "mypassword", // TODO prompt/autogenerate on deploy stack and save in datastore
	}
	jsonValue, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost, loginURL, bytes.NewBuffer(jsonValue))
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
