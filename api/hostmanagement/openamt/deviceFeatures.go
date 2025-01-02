package openamt

import (
	"fmt"
	"net/http"

	portainer "github.com/portainer/portainer/api"

	"github.com/segmentio/encoding/json"
)

func (service *Service) enableDeviceFeatures(configuration portainer.OpenAMTConfiguration, deviceGUID string, features portainer.OpenAMTDeviceEnabledFeatures) error {
	url := fmt.Sprintf("https://%s/mps/api/v1/amt/features/%s", configuration.MPSServer, deviceGUID)

	payload := map[string]any{
		"enableSOL":   features.SOL,
		"enableIDER":  features.IDER,
		"enableKVM":   features.KVM,
		"redirection": features.Redirection,
		"userConsent": features.UserConsent,
	}
	jsonValue, _ := json.Marshal(payload)

	_, err := service.executeSaveRequest(http.MethodPost, url, configuration.MPSToken, jsonValue)

	return err
}
