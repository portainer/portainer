package validate

import (
	"github.com/go-playground/validator/v10"
)

func registerValidationMethods(v *validator.Validate) {
	v.RegisterValidation("validate_bool", ValidateBool)
}

/**
 * Validation methods below are being used for custom validation
 */
func ValidateBool(fl validator.FieldLevel) bool {
	_, ok := fl.Field().Interface().(bool)
	return ok
}
