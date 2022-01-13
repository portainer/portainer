package openamt

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	portainer "github.com/portainer/portainer/api"
)

type ActionResponse struct {
	Body struct {
		ReturnValue    int    `json:"ReturnValue"`
		ReturnValueStr string `json:"ReturnValueStr"`
	} `json:"Body"`
}

func (service *Service) executeDeviceAction(configuration portainer.OpenAMTConfiguration, deviceGUID string, action int) error {
	url := fmt.Sprintf("https://%s/mps/api/v1/amt/power/action/%s", configuration.MPSServer, deviceGUID)

	payload := map[string]int{
		"action": action,
	}
	jsonValue, _ := json.Marshal(payload)

	responseBody, err := service.executeSaveRequest(http.MethodPost, url, configuration.MPSToken, jsonValue)
	if err != nil {
		return err
	}

	var response ActionResponse
	err = json.Unmarshal(responseBody, &response)
	if err != nil {
		return err
	}

	if response.Body.ReturnValue != 0 {
		return fmt.Errorf("failed to execute action, error status %v: %s", response.Body.ReturnValue, response.Body.ReturnValueStr)
	}

	return nil
}

func parseAction(actionRaw string) (portainer.PowerState, error) {
	switch strings.ToLower(actionRaw) {
	case "power on":
		return powerOnState, nil
	case "power off":
		return powerOffState, nil
	case "restart":
		return restartState, nil
	}
	return 0, fmt.Errorf("unsupported device action %s", actionRaw)
}
