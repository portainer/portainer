package openamt

import (
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"

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
	url := fmt.Sprintf("https://%s/rps/api/v1/admin/ciraconfigs/%s", configuration.MPSServer, configName)

	responseBody, err := service.executeGetRequest(url, configuration.MPSToken)
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
	url := fmt.Sprintf("https://%s/rps/api/v1/admin/ciraconfigs", configuration.MPSServer)

	certificate, err := service.getCIRACertificate(configuration)
	if err != nil {
		return nil, err
	}

	addressFormat, err := addressFormat(configuration.MPSServer)
	if err != nil {
		return nil, err
	}

	config := CIRAConfig{
		ConfigName:          configName,
		MPSServerAddress:    configuration.MPSServer,
		CommonName:          configuration.MPSServer,
		ServerAddressFormat: addressFormat,
		MPSPort:             4433,
		Username:            "admin",
		MPSRootCertificate:  certificate,
		RegeneratePassword:  false,
		AuthMethod:          2,
	}
	payload, _ := json.Marshal(config)

	responseBody, err := service.executeSaveRequest(method, url, configuration.MPSToken, payload)
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

func addressFormat(url string) (int, error) {
	ip := net.ParseIP(url)
	if ip == nil {
		return 201, nil // FQDN
	}
	if strings.Contains(url, ".") {
		return 3, nil // IPV4
	}
	if strings.Contains(url, ":") {
		return 4, nil // IPV6
	}
	return 0, fmt.Errorf("could not determine server address format for %s", url)
}

func (service *Service) getCIRACertificate(configuration portainer.OpenAMTConfiguration) (string, error) {
	loginURL := fmt.Sprintf("https://%s/mps/api/v1/ciracert", configuration.MPSServer)

	req, err := http.NewRequest(http.MethodGet, loginURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", configuration.MPSToken))

	response, err := service.httpsClient.Do(req)
	if err != nil {
		return "", err
	}

	if response.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status code %s", response.Status)
	}

	certificate, err := io.ReadAll(response.Body)
	if err != nil {
		return "", err
	}
	block, _ := pem.Decode(certificate)
	return base64.StdEncoding.EncodeToString(block.Bytes), nil
}
