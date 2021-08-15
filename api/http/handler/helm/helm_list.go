package helm

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
)

// @id HelmList
// @summary List Helm Chart(s)
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
// @router /kubernetes/helm/list [get]
func (handler *Handler) helmList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {

	// TODO read query params
	// - namespace (default all-namespaces, no-query-param)
	// - filter (release-name)
	// - output (default JSON)

	endpoint, httperr := handler.GetEndpoint(r)
	if httperr != nil {
		return httperr
	}

	proxyServerURL := getProxyUrl(r, endpoint.ID)

	bearerToken, err := extractBearerToken(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusUnauthorized, "Unauthorized", err}
	}

	v := r.URL.Query()
	namespace := v.Get("namespace") // Optional

	args := []string{"-o", "json"}

	if namespace != "" {
		args = append(args, "--namespace", namespace)
	}

	result, err := handler.HelmPackageManager.Run("list", args, proxyServerURL, bearerToken)
	if err != nil {
		return nil
	}

	// TODO - return struct - document type in swagger

	w.Write([]byte(result))
	return nil
}
