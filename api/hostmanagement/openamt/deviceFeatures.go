package openamt

import (
	"encoding/json"
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"
)

func (service *Service) enableDeviceFeatures(configuration portainer.OpenAMTConfiguration, deviceGUID string, features portainer.OpenAMTDeviceEnabledFeatures) error {
	url := fmt.Sprintf("https://%s/mps/api/v1/amt/features/%s", configuration.MPSServer, deviceGUID)

	payload := map[string]interface{}{
		"enableSOL":   features.SOL,
		"enableIDER":  features.IDER,
		"enableKVM":   features.KVM,
		"redirection": features.Redirection,
		"userConsent": features.UserConsent,
	}
	jsonValue, _ := json.Marshal(payload)

	_, err := service.executeSaveRequest(http.MethodPost, url, configuration.MPSToken, jsonValue)
	if err != nil {
		return err
	}

	return nil
}
