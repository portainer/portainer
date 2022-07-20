package security

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
)

type PasswordStrengthChecker interface {
	Check(password string) bool
}

type passwordStrengthChecker struct {
	settings settingsService
}

func NewPasswordStrengthChecker(settings settingsService) *passwordStrengthChecker {
	return &passwordStrengthChecker{
		settings: settings,
	}
}

// Check returns true if the password is strong enough
func (c *passwordStrengthChecker) Check(password string) bool {
	s, err := c.settings.Settings()
	if err != nil {
		logrus.WithError(err).Warn("failed to fetch Portainer settings to validate user password")
		return true
	}

	return len(password) >= s.InternalAuthSettings.RequiredPasswordLength
}

type settingsService interface {
	Settings() (*portainer.Settings, error)
}
