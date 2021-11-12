package openamt

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"
)

const (
	MpsServerAddress          = "127.0.0.1" // TODO: this is the same IP that must be used for the OpenAMT stack deployment, is this value right?
	MpsServerAdminUser        = "admin"
	DefaultCIRAConfigName     = "ciraConfigDefault"
	DefaultWirelessConfigName = "wirelessProfileDefault"
	DefaultProfileName        = "profileAMTDefault"
	DefaultDomainName         = "domainDefault"
)

// Service represents a service for managing an OpenAMT server.
type Service struct {
	httpsClient *http.Client
}

// NewService initializes a new service.
func NewService() *Service {
	return &Service{
		httpsClient:
		&http.Client{
			Timeout: time.Second * time.Duration(5),
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			},
		},
	}
}

type openAMTError struct {
	ErrorMsg string `json:"message"`
	Errors   []struct {
		ErrorMsg string `json:"msg"`
	} `json:"errors"`
}

func parseError(responseBody []byte) error {
	var errorResponse openAMTError
	err := json.Unmarshal(responseBody, &errorResponse)
	if err != nil {
		return err
	}

	if len(errorResponse.Errors) > 0 {
		return errors.New(errorResponse.Errors[0].ErrorMsg)
	}
	if errorResponse.ErrorMsg != "" {
		return errors.New(errorResponse.ErrorMsg)
	}
	return nil
}

func (service *Service) ConfigureDefault() error {
	token, err := service.executeAuthenticationRequest()
	if err != nil {
		return err
	}

	ciraConfig, err := service.createOrUpdateCIRAConfig(token.Token, DefaultCIRAConfigName)
	if err != nil {
		return err
	}

	profile, err := service.createOrUpdateAMTProfile(token.Token, DefaultProfileName, ciraConfig.ConfigName, "")
	if err != nil {
		return err
	}

	fmt.Println(ciraConfig.ConfigName)
	fmt.Println(profile.ProfileName)

	return nil
}

func (service *Service) executeSaveRequest(method, url, token string, payload []byte) ([]byte, error) {
	req, err := http.NewRequest(method, url, bytes.NewBuffer(payload))
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

	if response.StatusCode < 200 || response.StatusCode > 300 {
		errorResponse := parseError(responseBody)
		if errorResponse != nil {
			return nil, errorResponse
		}
		return nil, errors.New(fmt.Sprintf("unexpected status code %v", response.Status))
	}

	return responseBody, nil
}

func (service *Service) executeGetRequest(url, token string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
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

	if response.StatusCode < 200 || response.StatusCode > 300 {
		if response.StatusCode == http.StatusNotFound {
			return nil, nil
		}
		errorResponse := parseError(responseBody)
		if errorResponse != nil {
			return nil, errorResponse
		}
		return nil, errors.New(fmt.Sprintf("unexpected status code %v", response.Status))
	}

	return responseBody, nil
}