package customtemplates

import (
	"errors"
	"regexp"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

func populateGitConfig(tx dataservices.DataStoreTx, userContext *dataservices.SourceServiceUserContext, template *portainer.CustomTemplate) {
	if template.Artifact == nil || len(template.Artifact.Files) == 0 {
		return
	}

	file := template.Artifact.Files[0]

	src, err := tx.Source().Read(userContext, file.SourceID)
	if err != nil || src.Git == nil {
		return
	}

	cfg := *src.Git
	cfg.ReferenceName = file.Ref
	cfg.ConfigFilePath = file.Path
	cfg.ConfigHash = file.Hash

	if cfg.Authentication != nil {
		sanitized := *cfg.Authentication
		sanitized.Password = ""
		cfg.Authentication = &sanitized
	}

	template.GitConfig = &cfg
}

// IsValidNote reports whether note is safe to display. Notes containing <img> tags are rejected.
func IsValidNote(note string) bool {
	if len(note) == 0 {
		return true
	}
	match, _ := regexp.MatchString("<img", note)
	return !match
}

// ValidateVariablesDefinitions returns an error if any variable definition is missing a required field.
func ValidateVariablesDefinitions(variables []portainer.CustomTemplateVariableDefinition) error {
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
