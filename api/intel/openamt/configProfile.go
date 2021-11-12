package openamt

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type (
	Profile struct {
		ProfileName                string       `json:"profileName"`
		Activation                 string       `json:"activation"`
		CIRAConfigName             *string      `json:"ciraConfigName"`
		GenerateRandomPassword     bool         `json:"generateRandomPassword"`
		GenerateRandomMEBxPassword bool         `json:"generateRandomMEBxPassword"`
		Tags                       []string     `json:"tags"`
		DHCPEnabled                bool         `json:"dhcpEnabled"`
		TenantId                   string       `json:"tenantId"`
		WIFIConfigs                []WifiConfig `json:"wifiConfigs"`
	}

	WifiConfig struct {
		Priority    int    `json:"priority"`
		ProfileName string `json:"profileName"`
	}
)

func (service *Service) createOrUpdateAMTProfile(token, profileName string, ciraConfigName string, wirelessConfigName string) (*Profile, error) {
	profile, err := service.getAMTProfile(token, profileName)
	if err != nil {
		return nil, err
	}

	method := http.MethodPost
	if profile != nil {
		method = http.MethodPatch
	}

	profile, err = service.saveAMTProfile(method, token, profileName, ciraConfigName, wirelessConfigName)
	if err != nil {
		return nil, err
	}
	return profile, nil
}

func (service *Service) getAMTProfile(token string, profileName string) (*Profile, error) {
	url := fmt.Sprintf("https://%v/rps/api/v1/admin/profiles/%v", MpsServerAddress, profileName)

	responseBody, err := service.executeGetRequest(url, token)
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

func (service *Service) saveAMTProfile(method string, token string, profileName string, ciraConfigName string, wirelessConfigName string) (*Profile, error) {
	url := fmt.Sprintf("https://%v/rps/api/v1/admin/profiles", MpsServerAddress)

	profile := Profile{
		ProfileName: profileName,
		Activation: "acmactivate",
		GenerateRandomPassword: true,
		GenerateRandomMEBxPassword: true,
		CIRAConfigName: &ciraConfigName,
		Tags: []string{},
		DHCPEnabled: true,
	}
	if wirelessConfigName != "" {
		profile.WIFIConfigs = []WifiConfig{
			{
				Priority: 1,
				ProfileName: wirelessConfigName,
			},
		}
	}
	payload, _ := json.Marshal(profile)

	responseBody, err := service.executeSaveRequest(method, url, token, payload)
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
