package templates

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type templateUpdatePayload struct {
	Title             *string
	Description       *string
	AdministratorOnly *bool
	Name              *string
	Logo              *string
	Note              *string
	Platform          *string
	Categories        []string
	Env               []portainer.TemplateEnv
	Image             *string
	Registry          *string
	Repository        portainer.TemplateRepository
	Command           *string
	Network           *string
	Volumes           []portainer.TemplateVolume
	Ports             []string
	Labels            []portainer.Pair
	Privileged        *bool
	Interactive       *bool
	RestartPolicy     *string
	Hostname          *string
}

func (payload *templateUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/templates/:id
func (handler *Handler) templateUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	templateID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid template identifier route variable", err}
	}

	template, err := handler.TemplateService.Template(portainer.TemplateID(templateID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find a template with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a template with the specified identifier inside the database", err}
	}

	var payload templateUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	updateTemplate(template, &payload)

	err = handler.TemplateService.UpdateTemplate(template.ID, template)
	if err != nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to persist template changes inside the database", err}
	}

	return response.JSON(w, template)
}

func updateContainerProperties(template *portainer.Template, payload *templateUpdatePayload) {
	if payload.Image != nil {
		template.Image = *payload.Image
	}

	if payload.Registry != nil {
		template.Registry = *payload.Registry
	}

	if payload.Command != nil {
		template.Command = *payload.Command
	}

	if payload.Network != nil {
		template.Network = *payload.Network
	}

	if payload.Volumes != nil {
		template.Volumes = payload.Volumes
	}

	if payload.Ports != nil {
		template.Ports = payload.Ports
	}

	if payload.Labels != nil {
		template.Labels = payload.Labels
	}

	if payload.Privileged != nil {
		template.Privileged = *payload.Privileged
	}

	if payload.Interactive != nil {
		template.Interactive = *payload.Interactive
	}

	if payload.RestartPolicy != nil {
		template.RestartPolicy = *payload.RestartPolicy
	}

	if payload.Hostname != nil {
		template.Hostname = *payload.Hostname
	}
}

func updateStackProperties(template *portainer.Template, payload *templateUpdatePayload) {
	if payload.Repository.URL != "" && payload.Repository.StackFile != "" {
		template.Repository = payload.Repository
	}
}

func updateTemplate(template *portainer.Template, payload *templateUpdatePayload) {
	if payload.Title != nil {
		template.Title = *payload.Title
	}

	if payload.Description != nil {
		template.Description = *payload.Description
	}

	if payload.Name != nil {
		template.Name = *payload.Name
	}

	if payload.Logo != nil {
		template.Logo = *payload.Logo
	}

	if payload.Note != nil {
		template.Note = *payload.Note
	}

	if payload.Platform != nil {
		template.Platform = *payload.Platform
	}

	if payload.Categories != nil {
		template.Categories = payload.Categories
	}

	if payload.Env != nil {
		template.Env = payload.Env
	}

	if payload.AdministratorOnly != nil {
		template.AdministratorOnly = *payload.AdministratorOnly
	}

	if template.Type == portainer.ContainerTemplate {
		updateContainerProperties(template, payload)
	} else if template.Type == portainer.SwarmStackTemplate || template.Type == portainer.ComposeStackTemplate {
		updateStackProperties(template, payload)
	}
}
