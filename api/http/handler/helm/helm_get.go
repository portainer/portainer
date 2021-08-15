package helm

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
)

// @id HelmGet
// @summary Get Helm Chart(s)
// @description
// @description **Access policy**: authorized
// @tags helm_chart
// @security jwt
// @accept json
// @produce json
// @param
// @success 200 {object} portainer.Helm "Success" - TODO
// @failure 401 "Unauthorized"
// @failure 404 "Endpoint or ServiceAccount not found"
// @failure 500 "Server error"
// @router /kubernetes/helm/{release} [get]
func (handler *Handler) helmGet(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	_, httperr := handler.GetEndpoint(r)
	if httperr != nil {
		return httperr
	}

	// TODO
	args := []string{}

	result, err := handler.HelmPackageManager.Run("get", args, "", "")
	if err != nil {
		return nil
	}

	w.Write([]byte(result))
	return nil
}
