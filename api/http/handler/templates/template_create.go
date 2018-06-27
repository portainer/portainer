package templates

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type templateCreatePayload struct {
	// Mandatory
	Type        string
	Title       string
	Description string

	// Opt stack/container
	Name       string
	Logo       string
	Note       string
	Platform   string
	Categories []string
	Env        []portainer.TemplateEnv

	// Mandatory container
	Image string

	// Mandatory stack
	Repository portainer.TemplateRepository

	// Opt container
	Command       string
	Network       string
	Volumes       []portainer.TemplateVolume
	Ports         []string
	Labels        []portainer.Pair
	Privileged    bool
	Interactive   bool
	RestartPolicy string
	Hostname      string
}

func (payload *templateCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Type) || (payload.Type != "container" && payload.Type != "stack") {
		return portainer.Error("Invalid template type. Valid values are: container or stack.")
	}
	if govalidator.IsNull(payload.Title) {
		return portainer.Error("Invalid template title")
	}
	if govalidator.IsNull(payload.Description) {
		return portainer.Error("Invalid template description")
	}

	if payload.Type == "container" {
		if govalidator.IsNull(payload.Image) {
			return portainer.Error("Invalid template image")
		}
	}

	if payload.Type == "stack" {
		if govalidator.IsNull(payload.Repository.URL) {
			return portainer.Error("Invalid template repository URL")
		}
		if govalidator.IsNull(payload.Repository.StackFile) {
			return portainer.Error("Invalid template repository Compose file path")
		}
	}

	return nil
}

// POST request on /api/templates
func (handler *Handler) templateCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload templateCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	template := &portainer.Template{
		Type:        payload.Type,
		Title:       payload.Title,
		Description: payload.Description,
		Name:        payload.Name,
		Logo:        payload.Logo,
		Note:        payload.Note,
		Platform:    payload.Platform,
		Categories:  payload.Categories,
		Env:         payload.Env,
	}

	if template.Type == "container" {
		template.Image = payload.Image
		template.Command = payload.Command
		template.Network = payload.Network
		template.Volumes = payload.Volumes
		template.Ports = payload.Ports
		template.Labels = payload.Labels
		template.Privileged = payload.Privileged
		template.Interactive = payload.Interactive
		template.RestartPolicy = payload.RestartPolicy
		template.Hostname = payload.Hostname
	}

	if template.Type == "stack" {
		template.Repository = payload.Repository
	}

	err = handler.TemplateService.CreateTemplate(template)
	if err != nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to persist the template inside the database", err}
	}

	return response.JSON(w, template)
}
