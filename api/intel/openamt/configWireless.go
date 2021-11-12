package openamt

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type (
	WirelessProfile struct {
		ProfileName          string `json:"profileName"`
		AuthenticationMethod int    `json:"authenticationMethod"`
		EncryptionMethod     int    `json:"encryptionMethod"`
		SSID                 string `json:"ssid"`
		PSKPassphrase        string `json:"pskPassphrase"`
	}
)

func (service *Service) createOrUpdateWirelessConfig(token string, configName string, authenticationMethod int, encryptionMethod int, ssid string, pskPass string) (*WirelessProfile, error) {
	wirelessConfig, err := service.getWirelessConfig(token, configName)
	if err != nil {
		return nil, err
	}

	method := http.MethodPost
	if wirelessConfig != nil {
		method = http.MethodPatch
	}

	wirelessConfig, err = service.saveWirelessConfig(method, token, configName, authenticationMethod, encryptionMethod, ssid, pskPass)
	if err != nil {
		return nil, err
	}
	return wirelessConfig, nil
}

func (service *Service) getWirelessConfig(token string, configName string) (*WirelessProfile, error) {
	url := fmt.Sprintf("https://%v/rps/api/v1/admin/wirelessconfigs/%v", MpsServerAddress, configName)

	responseBody, err := service.executeGetRequest(url, token)
	if err != nil {
		return nil, err
	}
	if responseBody == nil {
		return nil, nil
	}

	var result WirelessProfile
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (service *Service) saveWirelessConfig(method string, token string, configName string, authenticationMethod int, encryptionMethod int, ssid string, pskPassphrase string) (*WirelessProfile, error) {
	url := fmt.Sprintf("https://%v/rps/api/v1/admin/wirelessconfigs", MpsServerAddress)

	config := WirelessProfile{
		ProfileName:          configName,
		AuthenticationMethod: authenticationMethod,
		EncryptionMethod:     encryptionMethod,
		SSID:                 ssid,
		PSKPassphrase:        pskPassphrase,
	}
	payload, _ := json.Marshal(config)

	responseBody, err := service.executeSaveRequest(method, url, token, payload)
	if err != nil {
		return nil, err
	}

	var result WirelessProfile
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}
