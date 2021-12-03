package openamt

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	portainer "github.com/portainer/portainer/api"
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

func (service *Service) createOrUpdateWirelessConfig(configuration portainer.OpenAMTConfiguration, wirelessConfigName string) (*WirelessProfile, error) {
	wirelessConfig, err := service.getWirelessConfig(configuration, wirelessConfigName)
	if err != nil {
		return nil, err
	}

	method := http.MethodPost
	if wirelessConfig != nil {
		method = http.MethodPatch
	}

	wirelessConfig, err = service.saveWirelessConfig(method, configuration, wirelessConfigName)
	if err != nil {
		return nil, err
	}
	return wirelessConfig, nil
}

func (service *Service) getWirelessConfig(configuration portainer.OpenAMTConfiguration, configName string) (*WirelessProfile, error) {
	url := fmt.Sprintf("https://%s/rps/api/v1/admin/wirelessconfigs/%s", configuration.MPSServer, configName)

	responseBody, err := service.executeGetRequest(url, configuration.Credentials.MPSToken)
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

func (service *Service) saveWirelessConfig(method string, configuration portainer.OpenAMTConfiguration, configName string) (*WirelessProfile, error) {
	parsedAuthenticationMethod, err := strconv.Atoi(configuration.WirelessConfiguration.AuthenticationMethod)
	if err != nil {
		return nil, fmt.Errorf("error parsing wireless authentication method: %s", err.Error())
	}
	parsedEncryptionMethod, err := strconv.Atoi(configuration.WirelessConfiguration.EncryptionMethod)
	if err != nil {
		return nil, fmt.Errorf("error parsing wireless encryption method: %s", err.Error())
	}

	url := fmt.Sprintf("https://%s/rps/api/v1/admin/wirelessconfigs", configuration.MPSServer)

	config := WirelessProfile{
		ProfileName:          configName,
		AuthenticationMethod: parsedAuthenticationMethod,
		EncryptionMethod:     parsedEncryptionMethod,
		SSID:                 configuration.WirelessConfiguration.SSID,
		PSKPassphrase:        configuration.WirelessConfiguration.PskPass,
	}
	payload, _ := json.Marshal(config)

	responseBody, err := service.executeSaveRequest(method, url, configuration.Credentials.MPSToken, payload)
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
