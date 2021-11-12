package openamt

import (
	"encoding/json"
	"fmt"
	"net/http"
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

func (service *Service) createOrUpdateDomain(token string, domainName string, domainSuffix string, provisioningCert string, provisioningCertPassword string) (*Domain, error) {
	domain, err := service.getDomain(token, domainName)
	if err != nil {
		return nil, err
	}

	method := http.MethodPost
	if domain != nil {
		method = http.MethodPatch
	}

	domain, err = service.saveDomain(method, token, domainName, domainSuffix, provisioningCert, provisioningCertPassword)
	if err != nil {
		return nil, err
	}
	return domain, nil
}

func (service *Service) getDomain(token string, domainName string) (*Domain, error) {
	url := fmt.Sprintf("https://%v/rps/api/v1/admin/domains/%v", MpsServerAddress, domainName)

	responseBody, err := service.executeGetRequest(url, token)
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

func (service *Service) saveDomain(method string, token string, domainName string, domainSuffix string, provisioningCert string, provisioningCertPassword string) (*Domain, error) {
	url := fmt.Sprintf("https://%v/rps/api/v1/admin/domains", MpsServerAddress)

	profile := Domain{
		DomainName:                    domainName,
		DomainSuffix:                  domainSuffix,
		ProvisioningCert:              " ",          // TODO do we prompt user or use own certificate?
		ProvisioningCertPassword:      "certPass!1", // TODO what do we use here?
		ProvisioningCertStorageFormat: "string",
	}
	payload, _ := json.Marshal(profile)

	responseBody, err := service.executeSaveRequest(method, url, token, payload)
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
