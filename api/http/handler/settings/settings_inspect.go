package settings

import (
	"net/http"

	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/rbacutils"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/http/utils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

// @id SettingsInspect
// @summary Retrieve the settings of the Portainer instance
// @description Get the settings of the Portainer instance. Will return either all the settings or a subset of settings based on the user role.
// @description **Access policy**: Authenticated user.
// @tags settings
// @security ApiKeyAuth || jwt
// @produce json
// @success 200 {object} settingsInspectResponse "The settings object"
// @failure 401 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve the settings."
// @router /settings [get]
func (handler *Handler) settingsInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var roleBasedResponse interface{}
	err := handler.DataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		settings, err := tx.Settings().Settings()
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve the settings from the database", err)
		}

		user, err := security.RetrieveUserFromRequest(r, tx)
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve user details from request", err)
		}

		response := buildResponse(settings)

		role := rbacutils.RoleFromUser(user)

		roleBasedResponse = response.ForRole(role)

		return nil
	})

	return utils.TxResponse(w, roleBasedResponse, err)
}
