package update

import (
	"time"

	"github.com/asaskevich/govalidator"
	portainer "github.com/portainer/portainer/api"
	httperrors "github.com/portainer/portainer/api/http/errors"
)

func ValidateAutoUpdateSettings(autoUpdate *portainer.AutoUpdateSettings) error {
	if autoUpdate == nil {
		return nil
	}

	if autoUpdate.Webhook == "" && autoUpdate.Interval == "" {
		return httperrors.NewInvalidPayloadError("Webhook or Interval must be provided")
	}

	if autoUpdate.Webhook != "" && !govalidator.IsUUID(autoUpdate.Webhook) {
		return httperrors.NewInvalidPayloadError("invalid Webhook format")
	}

	if autoUpdate.Interval != "" {
		if _, err := time.ParseDuration(autoUpdate.Interval); err != nil {
			return httperrors.NewInvalidPayloadError("invalid Interval format")
		}
	}

	return nil
}
