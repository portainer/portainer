package system

import (
	"net/http"
	"regexp"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/http/handler/utils"
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
// @success 200 {object} status "Success"
// @router /system/upgrade [post]
func (handler *Handler) systemUpgrade(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload, err := utils.GetPayload[systemUpgradePayload](r)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	err = handler.upgradeService.Upgrade(payload.License)
	if err != nil {
		return httperror.InternalServerError("Unable to upgrade Portainer", err)
	}

	return response.Empty(w)
}
