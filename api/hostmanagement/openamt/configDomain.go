package openamt

import (
	"encoding/json"
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type (
	Domain struct {
		DomainName                    string `json:"profileName"`
		DomainSuffix                  string `json:"domainSuffix"`
		ProvisioningCert              string `json:"provisioningCert"`
		ProvisioningCertPassword      string `json:"provisioningCertPassword"`
		ProvisioningCertStorageFormat string `json:"provisioningCertStorageFormat"`
	}
)

func (service *Service) createOrUpdateDomain(configuration portainer.OpenAMTConfiguration) (*Domain, error) {
	domain, err := service.getDomain(configuration)
	if err != nil {
		return nil, err
	}

	method := http.MethodPost
	if domain != nil {
		method = http.MethodPatch
	}

	domain, err = service.saveDomain(method, configuration)
	if err != nil {
		return nil, err
	}
	return domain, nil
}

func (service *Service) getDomain(configuration portainer.OpenAMTConfiguration) (*Domain, error) {
	url := fmt.Sprintf("https://%s/rps/api/v1/admin/domains/%s", configuration.MPSServer, configuration.DomainConfiguration.DomainName)

	responseBody, err := service.executeGetRequest(url, configuration.Credentials.MPSToken)
	if err != nil {
		return nil, err
	}
	if responseBody == nil {
		return nil, nil
	}

	var result Domain
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (service *Service) saveDomain(method string, configuration portainer.OpenAMTConfiguration) (*Domain, error) {
	url := fmt.Sprintf("https://%s/rps/api/v1/admin/domains", configuration.MPSServer)

	profile := Domain{
		DomainName:                    configuration.DomainConfiguration.DomainName,
		DomainSuffix:                  configuration.DomainConfiguration.DomainName,
		ProvisioningCert:              configuration.DomainConfiguration.CertFileText,
		ProvisioningCertPassword:      configuration.DomainConfiguration.CertPassword,
		ProvisioningCertStorageFormat: "string",
	}
	payload, _ := json.Marshal(profile)

	responseBody, err := service.executeSaveRequest(method, url, configuration.Credentials.MPSToken, payload)
	if err != nil {
		return nil, err
	}

	var result Domain
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}
