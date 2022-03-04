package openamt

import (
	"encoding/json"
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

type (
	Profile struct {
		ProfileName                string              `json:"profileName"`
		Activation                 string              `json:"activation"`
		CIRAConfigName             *string             `json:"ciraConfigName"`
		GenerateRandomAMTPassword  bool                `json:"generateRandomPassword"`
		AMTPassword                string              `json:"amtPassword"`
		GenerateRandomMEBxPassword bool                `json:"generateRandomMEBxPassword"`
		MEBXPassword               string              `json:"mebxPassword"`
		Tags                       []string            `json:"tags"`
		DHCPEnabled                bool                `json:"dhcpEnabled"`
		TenantId                   string              `json:"tenantId"`
		WIFIConfigs                []ProfileWifiConfig `json:"wifiConfigs"`
	}

	ProfileWifiConfig struct {
		Priority    int    `json:"priority"`
		ProfileName string `json:"profileName"`
	}
)

func (service *Service) createOrUpdateAMTProfile(configuration portainer.OpenAMTConfiguration, profileName string, ciraConfigName string) (*Profile, error) {
	profile, err := service.getAMTProfile(configuration, profileName)
	if err != nil {
		return nil, err
	}

	method := http.MethodPost
	if profile != nil {
		method = http.MethodPatch
	}

	profile, err = service.saveAMTProfile(method, configuration, profileName, ciraConfigName)
	if err != nil {
		return nil, err
	}
	return profile, nil
}

func (service *Service) getAMTProfile(configuration portainer.OpenAMTConfiguration, profileName string) (*Profile, error) {
	url := fmt.Sprintf("https://%s/rps/api/v1/admin/profiles/%s", configuration.MPSServer, profileName)

	responseBody, err := service.executeGetRequest(url, configuration.MPSToken)
	if err != nil {
		return nil, err
	}
	if responseBody == nil {
		return nil, nil
	}

	var result Profile
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (service *Service) saveAMTProfile(method string, configuration portainer.OpenAMTConfiguration, profileName string, ciraConfigName string) (*Profile, error) {
	url := fmt.Sprintf("https://%s/rps/api/v1/admin/profiles", configuration.MPSServer)

	profile := Profile{
		ProfileName:                profileName,
		Activation:                 "acmactivate",
		GenerateRandomAMTPassword:  false,
		GenerateRandomMEBxPassword: false,
		AMTPassword:                configuration.MPSPassword,
		MEBXPassword:               configuration.MPSPassword,
		CIRAConfigName:             &ciraConfigName,
		Tags:                       []string{},
		DHCPEnabled:                true,
	}
	payload, _ := json.Marshal(profile)

	responseBody, err := service.executeSaveRequest(method, url, configuration.MPSToken, payload)
	if err != nil {
		return nil, err
	}

	var result Profile
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}
