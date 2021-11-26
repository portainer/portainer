package openamt

import (
	"encoding/json"
	"fmt"

	portainer "github.com/portainer/portainer/api"
)

type Device struct {
	GUID             string `json:"guid"`
	HostName         string `json:"hostname"`
	ConnectionStatus bool   `json:"connectionStatus"`
}

type DevicePowerState struct {
	State int `json:"powerstate"`
}

func (service *Service) getDevice(configuration portainer.OpenAMTConfiguration, deviceGUID string) (*Device, error) {
	url := fmt.Sprintf("https://%s/mps/api/v1/devices/%s", configuration.MPSURL, deviceGUID)

	responseBody, err := service.executeGetRequest(url, configuration.Credentials.MPSToken)
	if err != nil {
		return nil, err
	}
	if responseBody == nil {
		return nil, nil
	}

	var result Device
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (service *Service) getDevicePowerState(configuration portainer.OpenAMTConfiguration, deviceGUID string) (*DevicePowerState, error) {
	url := fmt.Sprintf("https://%s/mps/api/v1/amt/power/state/%s", configuration.MPSURL, deviceGUID)

	responseBody, err := service.executeGetRequest(url, configuration.Credentials.MPSToken)
	if err != nil {
		return nil, err
	}
	if responseBody == nil {
		return nil, nil
	}

	var result DevicePowerState
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}
