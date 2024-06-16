package system

import (
	"net/http"
	"regexp"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/pkg/errors"
)

type systemUpgradePayload struct {
	License string
}

var re = regexp.MustCompile(`^\d-.+`)

func (payload *systemUpgradePayload) Validate(r *http.Request) error {
	if payload.License == "" {
		return errors.New("license is missing")
	}

	if !re.MatchString(payload.License) {
		return errors.New("license is invalid")
	}

	return nil
}

// @id systemUpgrade
// @summary Upgrade Portainer to BE
// @description Upgrade Portainer to BE
// @description **Access policy**: administrator
// @tags system
// @produce json
// @success 204 {object} status "Success"
// @router /system/upgrade [post]
func (handler *Handler) systemUpgrade(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload, err := request.GetPayload[systemUpgradePayload](r)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	environment, platform, err := handler.getLocalEndpoint()
	if err != nil {
		return httperror.InternalServerError("Failed to guess local endpoint", err)
	}

	err = handler.upgradeService.Upgrade(platform, environment, payload.License)
	if err != nil {
		return httperror.InternalServerError("Failed to upgrade Portainer", err)
	}

	return response.Empty(w)
}
