package helm

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
)

// @id HelmDelete
// @summary Delete Helm Chart(s)
// @description
// @description **Access policy**: authorized
// @tags helm_chart
// @security jwt
// @accept json
// @produce json
// @param
// @success 204 {object} portainer.Helm "Success" - TODO
// @failure 401 "Unauthorized"
// @failure 404 "Endpoint or ServiceAccount not found"
// @failure 500 "Server error"
// @router /kubernetes/helm/{release} [delete]
func (handler *Handler) helmDelete(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	w.Write([]byte("Helm Delete"))
	return nil
}
