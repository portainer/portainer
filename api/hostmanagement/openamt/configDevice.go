package openamt

import (
	"encoding/json"
	"fmt"
	"strings"

	portainer "github.com/portainer/portainer/api"
)

type Device struct {
	GUID             string `json:"guid"`
	HostName         string `json:"hostname"`
	ConnectionStatus bool   `json:"connectionStatus"`
}

type DevicePowerState struct {
	State portainer.PowerState `json:"powerstate"`
}

type DeviceEnabledFeatures struct {
	Redirection bool   `json:"redirection"`
	KVM         bool   `json:"KVM"`
	SOL         bool   `json:"SOL"`
	IDER        bool   `json:"IDER"`
	UserConsent string `json:"userConsent"`
}

func (service *Service) getDevice(configuration portainer.OpenAMTConfiguration, deviceGUID string) (*Device, error) {
	url := fmt.Sprintf("https://%s/mps/api/v1/devices/%s", configuration.MPSServer, deviceGUID)

	responseBody, err := service.executeGetRequest(url, configuration.MPSToken)
	if err != nil {
		if strings.EqualFold(err.Error(), "invalid value") {
			return nil, nil
		}
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
	url := fmt.Sprintf("https://%s/mps/api/v1/amt/power/state/%s", configuration.MPSServer, deviceGUID)

	responseBody, err := service.executeGetRequest(url, configuration.MPSToken)
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

func (service *Service) getDeviceEnabledFeatures(configuration portainer.OpenAMTConfiguration, deviceGUID string) (*DeviceEnabledFeatures, error) {
	url := fmt.Sprintf("https://%s/mps/api/v1/amt/features/%s", configuration.MPSServer, deviceGUID)

	responseBody, err := service.executeGetRequest(url, configuration.MPSToken)
	if err != nil {
		return nil, err
	}
	if responseBody == nil {
		return nil, nil
	}

	var result DeviceEnabledFeatures
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}
