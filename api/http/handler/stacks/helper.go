package stacks

import (
	"errors"
	"time"

	"github.com/asaskevich/govalidator"
	portainer "github.com/portainer/portainer/api"
)

func validateStackAutoUpdate(autoUpdate *portainer.StackAutoUpdate) error {
	if autoUpdate == nil {
		return nil
	}
	if autoUpdate.Interval == "" && autoUpdate.Webhook == "" {
		return errors.New("Both Interval and Webhook fields are empty")
	}
	if autoUpdate.Webhook != "" && !govalidator.IsUUID(autoUpdate.Webhook) {
		return errors.New("Invalid Webhook format")
	}
	if autoUpdate.Interval != "" {
		if _, err := time.ParseDuration(autoUpdate.Interval); err != nil {
			return errors.New("Invalid Interval format")
		}
	}
	return nil
}
