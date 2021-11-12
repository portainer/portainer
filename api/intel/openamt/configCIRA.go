package openamt

import (
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
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
	RegeneratePassword  bool   `json:"regeneratePassword"`
	AuthMethod          int    `json:"authMethod"`
}

func (service *Service) createOrUpdateCIRAConfig(token, configName string) (*CIRAConfig, error) {
	ciraConfig, err := service.getCIRAConfig(token, configName)
	if err != nil {
		return nil, err
	}

	method := http.MethodPost
	if ciraConfig != nil {
		method = http.MethodPatch
	}

	ciraConfig, err = service.saveCIRAConfig(method, token, configName)
	if err != nil {
		return nil, err
	}
	return ciraConfig, nil
}

func (service *Service) getCIRAConfig(token string, configName string) (*CIRAConfig, error) {
	url := fmt.Sprintf("https://%v/rps/api/v1/admin/ciraconfigs/%v", MpsServerAddress, configName)

	responseBody, err := service.executeGetRequest(url, token)
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

func (service *Service) saveCIRAConfig(method string, token string, configName string) (*CIRAConfig, error) {
	url := fmt.Sprintf("https://%v/rps/api/v1/admin/ciraconfigs", MpsServerAddress)

	certificate, err := service.getCIRACertificate(token)
	if err != nil {
		return nil, err
	}

	config := CIRAConfig{
		ConfigName:          configName,
		MPSServerAddress:    MpsServerAddress,
		ServerAddressFormat: 3,
		CommonName:          MpsServerAddress,
		MPSPort:             4433,
		Username:            MpsServerAdminUser,
		MPSRootCertificate:  certificate,
		RegeneratePassword:  false,
		AuthMethod:          2,
	}
	payload, _ := json.Marshal(config)

	responseBody, err := service.executeSaveRequest(method, url, token, payload)
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

func (service *Service) getCIRACertificate(token string) (string, error) {
	loginURL := fmt.Sprintf("https://%v/mps/api/v1/ciracert", MpsServerAddress)

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
