package customtemplates

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
)

func validateVariablesDefinitions(variables []portainer.CustomTemplateVariableDefinition) error {
	for _, variable := range variables {
		if variable.Name == "" {
			return errors.New("variable name is required")
		}
		if variable.Label == "" {
			return errors.New("variable label is required")
		}
	}
	return nil
}
