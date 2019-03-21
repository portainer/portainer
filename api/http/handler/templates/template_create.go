package templates

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
)

type templateCreatePayload struct {
	// Mandatory
	Type              int
	Title             string
	Description       string
	AdministratorOnly bool

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
	Registry      string
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
	if payload.Type == 0 || (payload.Type != 1 && payload.Type != 2 && payload.Type != 3) {
		return portainer.Error("Invalid template type. Valid values are: 1 (container), 2 (Swarm stack template) or 3 (Compose stack template).")
	}
	if govalidator.IsNull(payload.Title) {
		return portainer.Error("Invalid template title")
	}
	if govalidator.IsNull(payload.Description) {
		return portainer.Error("Invalid template description")
	}

	if payload.Type == 1 {
		if govalidator.IsNull(payload.Image) {
			return portainer.Error("Invalid template image")
		}
	}

	if payload.Type == 2 || payload.Type == 3 {
		if govalidator.IsNull(payload.Repository.URL) {
			return portainer.Error("Invalid template repository URL")
		}
		if govalidator.IsNull(payload.Repository.StackFile) {
			payload.Repository.StackFile = filesystem.ComposeFileDefaultName
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
		Type:              portainer.TemplateType(payload.Type),
		Title:             payload.Title,
		Description:       payload.Description,
		AdministratorOnly: payload.AdministratorOnly,
		Name:              payload.Name,
		Logo:              payload.Logo,
		Note:              payload.Note,
		Platform:          payload.Platform,
		Categories:        payload.Categories,
		Env:               payload.Env,
	}

	if template.Type == portainer.ContainerTemplate {
		template.Image = payload.Image
		template.Registry = payload.Registry
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

	if template.Type == portainer.SwarmStackTemplate || template.Type == portainer.ComposeStackTemplate {
		template.Repository = payload.Repository
	}

	err = handler.TemplateService.CreateTemplate(template)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the template inside the database", err}
	}

	return response.JSON(w, template)
}
