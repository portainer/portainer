package openamt

import (
	"encoding/json"
	"fmt"
	portainer "github.com/portainer/portainer/api"
	"net/http"
)

func (service *Service) enableDeviceFeatures(configuration portainer.OpenAMTConfiguration, deviceGUID string) error {
	url := fmt.Sprintf("https://%s/mps/api/v1/amt/features/%s", configuration.MPSServer, deviceGUID)

	payload := map[string]interface{}{
		"enableIDER":  true,
		"enableKVM":   true,
		"enableSOL":   true,
		"redirection": false,
		"userConsent": "none",
	}
	jsonValue, _ := json.Marshal(payload)

	_, err := service.executeSaveRequest(http.MethodPost, url, configuration.Credentials.MPSToken, jsonValue)
	if err != nil {
		return err
	}

	return nil
}
