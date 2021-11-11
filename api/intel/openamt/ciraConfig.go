package openamt

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
)

type CIRAConfig struct {
	ConfigName          string `json:"configName"`
	MPSServerAddress    string `json:"mpsServerAddress"`
	ServerAddressFormat int    `json:"serverAddressFormat"`
	CommonName          string `json:"commonName"`
	MPSPort             int    `json:"mpsPort"`
	Username            string `json:"username"`
	MPSRootCertificate  string `json:"mpsRootCertificate"`
	RegeneratePassword  bool `json:"regeneratePassword"`
	AuthMethod          int `json:"authMethod"`
}

func (service *Service) createCIRAConfig(token string) (*CIRAConfig, error) {
	loginURL := fmt.Sprintf("%v/rps/api/v1/admin/ciraconfigs", MPS_SERVER_ADDRESS)

	certificate, err := service.getCIRACertificate(token)
	if err != nil {
		return nil, err
	}

	payload := CIRAConfig{
		ConfigName:          "ciraConfigDefault",
		MPSServerAddress:    "192.168.0.100",
		ServerAddressFormat: 3,
		CommonName:          "192.168.0.100",
		MPSPort:             4433,
		Username:            "admin",
		MPSRootCertificate:  certificate,
		RegeneratePassword:  false,
		AuthMethod:          2,
	}
	jsonValue, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost, loginURL, bytes.NewBuffer(jsonValue))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %v", token))

	response, err := service.httpsClient.Do(req)
	if err != nil {
		return nil, err
	}
	responseBody, readErr := ioutil.ReadAll(response.Body)
	if readErr != nil {
		return nil, readErr
	}

	var errorResponse errorResponse
	err = json.Unmarshal(responseBody, &errorResponse)
	if err != nil {
		return nil, err
	}
	if len(errorResponse.Errors) > 0 {
		return nil, errors.New(errorResponse.Errors[0].ErrorMsg)
	}
	if errorResponse.ErrorMsg != "" {
		return nil, errors.New(errorResponse.ErrorMsg)
	}

	if response.StatusCode != http.StatusCreated {
		return nil, errors.New(fmt.Sprintf("unexpected status code %v", response.Status))
	}

	var result CIRAConfig
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (service *Service) getCIRACertificate(token string) (string, error) {
	loginURL := fmt.Sprintf("%v/mps/api/v1/ciracert", MPS_SERVER_ADDRESS)

	req, err := http.NewRequest(http.MethodGet, loginURL, nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %v", token))

	response, err := service.httpsClient.Do(req)
	if err != nil {
		return "", err
	}

	if response.StatusCode != http.StatusOK {
		return "", errors.New(fmt.Sprintf("unexpected status code %v", response.Status))
	}

	certificate, err := io.ReadAll(response.Body)
	if err != nil {
		return "", err
	}
	block, _ := pem.Decode(certificate)
	return base64.StdEncoding.EncodeToString(block.Bytes), nil
}
