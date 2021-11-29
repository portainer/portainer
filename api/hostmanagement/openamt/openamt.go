package openamt

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
)

const (
	DefaultCIRAConfigName     = "ciraConfigDefault"
	DefaultWirelessConfigName = "wirelessProfileDefault"
	DefaultProfileName        = "profileAMTDefault"

	PowerUpAction  = 2
	PowerOffAction = 8
	RestartAction  = 5
)

// Service represents a service for managing an OpenAMT server.
type Service struct {
	httpsClient *http.Client
}

// NewService initializes a new service.
func NewService(dataStore portainer.DataStore) *Service {
	if !dataStore.Settings().IsFeatureFlagEnabled(portainer.FeatOpenAMT) {
		return nil
	}
	return &Service{
		httpsClient: &http.Client{
			Timeout: time.Second * time.Duration(60),
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

func (service *Service) ConfigureDefault(configuration portainer.OpenAMTConfiguration) error {
	token, err := service.executeAuthenticationRequest(configuration)
	if err != nil {
		return err
	}
	configuration.Credentials.MPSToken = token.Token

	ciraConfig, err := service.createOrUpdateCIRAConfig(configuration, DefaultCIRAConfigName)
	if err != nil {
		return err
	}

	wirelessConfigName := ""
	if configuration.WirelessConfiguration != nil {
		wirelessConfig, err := service.createOrUpdateWirelessConfig(configuration, DefaultWirelessConfigName)
		if err != nil {
			return err
		}
		wirelessConfigName = wirelessConfig.ProfileName
	}

	_, err = service.createOrUpdateAMTProfile(configuration, DefaultProfileName, ciraConfig.ConfigName, wirelessConfigName)
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
		return nil, errors.New(fmt.Sprintf("unexpected status code %s", response.Status))
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
		return nil, errors.New(fmt.Sprintf("unexpected status code %s", response.Status))
	}

	return responseBody, nil
}

func (service *Service) DeviceInformation(configuration portainer.OpenAMTConfiguration, deviceGUID string) (*portainer.OpenAMTDeviceInformation, error) {
	token, err := service.executeAuthenticationRequest(configuration)
	if err != nil {
		return nil, err
	}
	configuration.Credentials.MPSToken = token.Token

	amtErrors := make(chan error)
	wgDone := make(chan bool)

	var wg sync.WaitGroup
	var resultDevice *Device
	var resultPowerState *DevicePowerState
	wg.Add(2)

	go func() {
		device, err := service.getDevice(configuration, deviceGUID)
		if err != nil {
			amtErrors <- err
		}
		if device == nil {
			amtErrors <- fmt.Errorf("device %s not found", deviceGUID)
		}
		resultDevice = device
		wg.Done()
	}()

	go func() {
		powerState, err := service.getDevicePowerState(configuration, deviceGUID)
		if err != nil {
			amtErrors <- err
		}
		resultPowerState = powerState
		wg.Done()
	}()

	go func() {
		wg.Wait()
		close(wgDone)
	}()

	select {
	case <-wgDone:
		break
	case err := <-amtErrors:
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

	return deviceInformation, nil
}

func (service *Service) ExecuteDeviceAction(configuration portainer.OpenAMTConfiguration, deviceGUID string, action string) error {
	parsedAction, err := parseAction(action)
	if err != nil {
		return err
	}

	token, err := service.executeAuthenticationRequest(configuration)
	if err != nil {
		return err
	}
	configuration.Credentials.MPSToken = token.Token

	err = service.executeDeviceAction(configuration, deviceGUID, parsedAction)
	if err != nil {
		return err
	}

	return nil
}
