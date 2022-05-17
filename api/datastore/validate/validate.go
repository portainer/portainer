package validate

import (
	"github.com/go-playground/validator/v10"
	portainer "github.com/portainer/portainer/api"
)

var validate *validator.Validate

func ValidateLDAPSettings(ldp *portainer.LDAPSettings) error {
	validate = validator.New()
	registerValidationMethods(validate)

	return validate.Struct(ldp)
}
