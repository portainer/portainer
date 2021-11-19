package openamt

import (
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type CIRAConfig struct {
	ConfigName          string `json:"configName"`
	MPSServerAddress    string `json:"mpsServerAddress"`
	ServerAddressFormat int    `json:"serverAddressFormat"`
	CommonName          string `json:"commonName"`
	MPSPort             int    `json:"mpsPort"`
	Username            string `json:"username"`
	MPSRootCertificate  string `json:"mpsRootCertificate"`
	RegeneratePassword  bool   `json:"regeneratePassword"`
	AuthMethod          int    `json:"authMethod"`
}

func (service *Service) createOrUpdateCIRAConfig(configuration portainer.OpenAMTConfiguration, configName string) (*CIRAConfig, error) {
	ciraConfig, err := service.getCIRAConfig(configuration, configName)
	if err != nil {
		return nil, err
	}

	method := http.MethodPost
	if ciraConfig != nil {
		method = http.MethodPatch
	}

	ciraConfig, err = service.saveCIRAConfig(method, configuration, configName)
	if err != nil {
		return nil, err
	}
	return ciraConfig, nil
}

func (service *Service) getCIRAConfig(configuration portainer.OpenAMTConfiguration, configName string) (*CIRAConfig, error) {
	url := fmt.Sprintf("https://%v/rps/api/v1/admin/ciraconfigs/%v", configuration.MPSURL, configName)

	responseBody, err := service.executeGetRequest(url, configuration.Credentials.MPSToken)
	if err != nil {
		return nil, err
	}
	if responseBody == nil {
		return nil, nil
	}

	var result CIRAConfig
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (service *Service) saveCIRAConfig(method string, configuration portainer.OpenAMTConfiguration, configName string) (*CIRAConfig, error) {
	url := fmt.Sprintf("https://%v/rps/api/v1/admin/ciraconfigs", configuration.MPSURL)

	certificate, err := service.getCIRACertificate(configuration)
	if err != nil {
		return nil, err
	}

	config := CIRAConfig{
		ConfigName:          configName,
		MPSServerAddress:    configuration.MPSURL,
		ServerAddressFormat: 3,
		CommonName:          configuration.MPSURL,
		MPSPort:             4433,
		Username:            "admin",
		MPSRootCertificate:  certificate,
		RegeneratePassword:  false,
		AuthMethod:          2,
	}
	payload, _ := json.Marshal(config)

	responseBody, err := service.executeSaveRequest(method, url, configuration.Credentials.MPSToken, payload)
	if err != nil {
		return nil, err
	}

	var result CIRAConfig
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (service *Service) getCIRACertificate(configuration portainer.OpenAMTConfiguration) (string, error) {
	loginURL := fmt.Sprintf("https://%v/mps/api/v1/ciracert", configuration.MPSURL)

	req, err := http.NewRequest(http.MethodGet, loginURL, nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %v", configuration.Credentials.MPSToken))

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
