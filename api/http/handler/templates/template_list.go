package templates

import (
	"net/http"

	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/response"
	"github.com/portainer/portainer/http/security"
)

// GET request on /api/templates?key=<key>
func (handler *Handler) templateList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	templates, err := handler.TemplateService.Templates()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve templates from the database", err}
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve info from request context", err}
	}

	filteredTemplates := security.FilterTemplates(templates, securityContext)

	return response.JSON(w, filteredTemplates)

	// TODO: remove this
	// key, err := request.RetrieveQueryParameter(r, "key", false)
	// if err != nil {
	// 	return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: key", err}
	// }
	//
	// templatesURL, templateErr := handler.retrieveTemplateURLFromKey(key)
	// if templateErr != nil {
	// 	return templateErr
	// }
	//
	// resp, err := http.Get(templatesURL)
	// if err != nil {
	// 	return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve templates via the network", err}
	// }
	// defer resp.Body.Close()
	//
	// body, err := ioutil.ReadAll(resp.Body)
	// if err != nil {
	// 	return &httperror.HandlerError{http.StatusInternalServerError, "Unable to read template response", err}
	// }
	//
	// return response.Bytes(w, body, "application/json")
}

// func (handler *Handler) retrieveTemplateURLFromKey(key string) (string, *httperror.HandlerError) {
// 	switch key {
// 	case "containers":
// 		settings, err := handler.SettingsService.Settings()
// 		if err != nil {
// 			return "", &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
// 		}
// 		return settings.TemplatesURL, nil
// 	case "linuxserver.io":
// 		return containerTemplatesURLLinuxServerIo, nil
// 	}
// 	return "", &httperror.HandlerError{http.StatusBadRequest, "Invalid value for query parameter: key. Value must be one of: containers or linuxserver.io", request.ErrInvalidQueryParameter}
// }
