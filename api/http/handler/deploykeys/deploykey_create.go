package deploykeys

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/request"
	"github.com/portainer/portainer/http/response"
)

type deploykeyCreatePayload struct {
	Name string
}

func (payload *deploykeyCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid deploykey name")
	}
	return nil
}

// POST request on /api/deploykeys
func (handler *Handler) deploykeyCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload deploykeyCreatePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	deploykeys, err := handler.DeploykeyService.Deploykeys()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve deploykeys from the database", err}
	}

	for _, deploykey := range deploykeys {
		if deploykey.Name == payload.Name {
			return &httperror.HandlerError{http.StatusConflict, "This name is already associated to a deploykey", portainer.ErrDeploykeyAlreadyExists}
		}
	}

	deploykey := &portainer.Deploykey{
		Name: payload.Name,
	}

	err = handler.DeploykeyService.CreateDeploykey(deploykey)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist the deploykey inside the database", err}
	}

	return response.JSON(w, deploykey)
}
