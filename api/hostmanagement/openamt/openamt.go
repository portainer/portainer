package openamt

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	portainer "github.com/portainer/portainer/api"
	"golang.org/x/sync/errgroup"
)

const (
	DefaultCIRAConfigName = "ciraConfigDefault"
	DefaultProfileName    = "profileAMTDefault"

	httpClientTimeout = 5 * time.Minute

	powerOnState  portainer.PowerState = 2
	powerOffState portainer.PowerState = 8
	restartState  portainer.PowerState = 5
)

// Service represents a service for managing an OpenAMT server.
type Service struct {
	httpsClient *http.Client
}

// NewService initializes a new service.
func NewService() *Service {
	return &Service{
		httpsClient: &http.Client{
			Timeout: httpClientTimeout,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
			},
		},
	}
}

type openAMTError struct {
	ErrorMsg string `json:"message"`
	Errors   []struct {
		ErrorMsg string `json:"msg"`
	} `json:"errors"`
}

func parseError(responseBody []byte) error {
	var errorResponse openAMTError
	err := json.Unmarshal(responseBody, &errorResponse)
	if err != nil {
		return err
	}

	if len(errorResponse.Errors) > 0 {
		return errors.New(errorResponse.Errors[0].ErrorMsg)
	}
	if errorResponse.ErrorMsg != "" {
		return errors.New(errorResponse.ErrorMsg)
	}
	return nil
}

func (service *Service) Configure(configuration portainer.OpenAMTConfiguration) error {
	token, err := service.Authorization(configuration)
	if err != nil {
		return err
	}
	configuration.MPSToken = token

	ciraConfig, err := service.createOrUpdateCIRAConfig(configuration, DefaultCIRAConfigName)
	if err != nil {
		return err
	}

	_, err = service.createOrUpdateAMTProfile(configuration, DefaultProfileName, ciraConfig.ConfigName)
	if err != nil {
		return err
	}

	_, err = service.createOrUpdateDomain(configuration)
	if err != nil {
		return err
	}

	return nil
}

func (service *Service) executeSaveRequest(method string, url string, token string, payload []byte) ([]byte, error) {
	req, err := http.NewRequest(method, url, bytes.NewBuffer(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	response, err := service.httpsClient.Do(req)
	if err != nil {
		return nil, err
	}
	responseBody, readErr := ioutil.ReadAll(response.Body)
	if readErr != nil {
		return nil, readErr
	}

	if response.StatusCode < 200 || response.StatusCode > 300 {
		errorResponse := parseError(responseBody)
		if errorResponse != nil {
			return nil, errorResponse
		}
		return nil, fmt.Errorf("unexpected status code %s", response.Status)
	}

	return responseBody, nil
}

func (service *Service) executeGetRequest(url string, token string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))

	response, err := service.httpsClient.Do(req)
	if err != nil {
		return nil, err
	}
	responseBody, readErr := ioutil.ReadAll(response.Body)
	if readErr != nil {
		return nil, readErr
	}

	if response.StatusCode < 200 || response.StatusCode > 300 {
		if response.StatusCode == http.StatusNotFound {
			return nil, nil
		}
		errorResponse := parseError(responseBody)
		if errorResponse != nil {
			return nil, errorResponse
		}
		return nil, fmt.Errorf("unexpected status code %s", response.Status)
	}

	return responseBody, nil
}

func (service *Service) DeviceInformation(configuration portainer.OpenAMTConfiguration, deviceGUID string) (*portainer.OpenAMTDeviceInformation, error) {
	token, err := service.Authorization(configuration)
	if err != nil {
		return nil, err
	}
	configuration.MPSToken = token

	var g errgroup.Group
	var resultDevice *Device
	var resultPowerState *DevicePowerState
	var resultEnabledFeatures *DeviceEnabledFeatures

	g.Go(func() error {
		device, err := service.getDevice(configuration, deviceGUID)
		if err != nil {
			return err
		}
		if device == nil {
			return fmt.Errorf("device %s not found", deviceGUID)
		}
		resultDevice = device
		return nil
	})

	g.Go(func() error {
		powerState, err := service.getDevicePowerState(configuration, deviceGUID)
		if err != nil {
			return err
		}
		resultPowerState = powerState
		return nil
	})

	g.Go(func() error {
		enabledFeatures, err := service.getDeviceEnabledFeatures(configuration, deviceGUID)
		if err != nil {
			return err
		}
		resultEnabledFeatures = enabledFeatures
		return nil
	})

	if err := g.Wait(); err != nil {
		return nil, err
	}

	deviceInformation := &portainer.OpenAMTDeviceInformation{
		GUID:             resultDevice.GUID,
		HostName:         resultDevice.HostName,
		ConnectionStatus: resultDevice.ConnectionStatus,
	}
	if resultPowerState != nil {
		deviceInformation.PowerState = resultPowerState.State
	}
	if resultEnabledFeatures != nil {
		deviceInformation.EnabledFeatures = &portainer.OpenAMTDeviceEnabledFeatures{
			Redirection: resultEnabledFeatures.Redirection,
			KVM:         resultEnabledFeatures.KVM,
			SOL:         resultEnabledFeatures.SOL,
			IDER:        resultEnabledFeatures.IDER,
			UserConsent: resultEnabledFeatures.UserConsent,
		}
	}

	return deviceInformation, nil
}

func (service *Service) ExecuteDeviceAction(configuration portainer.OpenAMTConfiguration, deviceGUID string, action string) error {
	parsedAction, err := parseAction(action)
	if err != nil {
		return err
	}

	token, err := service.Authorization(configuration)
	if err != nil {
		return err
	}
	configuration.MPSToken = token

	err = service.executeDeviceAction(configuration, deviceGUID, int(parsedAction))
	if err != nil {
		return err
	}

	return nil
}

func (service *Service) EnableDeviceFeatures(configuration portainer.OpenAMTConfiguration, deviceGUID string, features portainer.OpenAMTDeviceEnabledFeatures) (string, error) {
	token, err := service.Authorization(configuration)
	if err != nil {
		return "", err
	}
	configuration.MPSToken = token

	err = service.enableDeviceFeatures(configuration, deviceGUID, features)
	if err != nil {
		return "", err
	}

	return token, nil
}
