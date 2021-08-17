package helm

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/exec/helm"
	"github.com/portainer/portainer/api/exec/helm/release"
)

const defaultHelmRepoURL = "https://charts.bitnami.com/bitnami"

type installChartPayload struct {
	Namespace string `json:namespace`
	Name      string `json:"name"`
	Chart     string `json:"chart"`
	Values    string `json:"values"`
}

func (p *installChartPayload) Validate(_ *http.Request) error {
	var required []string
	if p.Name == "" {
		required = append(required, "name")
	}
	if p.Namespace == "" {
		required = append(required, "namespace")
	}
	if p.Chart == "" {
		required = append(required, "chart")
	}
	if len(required) > 0 {
		return fmt.Errorf("required field(s) missing: %s", strings.Join(required, ", "))
	}
	return nil
}

func readPayload(r *http.Request) (*installChartPayload, error) {
	p := new(installChartPayload)
	err := request.DecodeAndValidateJSONPayload(r, p)
	if err != nil {
		return nil, err
	}

	return p, nil
}

// @id HelmInstall
// @summary Install Helm Chart
// @description
// @description **Access policy**: authorized
// @tags helm_chart
// @security jwt
// @accept json
// @produce json
// @param body installChartPayload true "EdgeGroup data when method is string"
// @success 201 {object} helm.Release "Created"
// @failure 401 "Unauthorized"
// @failure 404 "Endpoint or ServiceAccount not found"
// @failure 500 "Server error"
// @router /kubernetes/helm/{release} [post]
func (handler *Handler) helmInstall(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpoint, httperr := handler.GetEndpoint(r)
	if httperr != nil {
		return httperr
	}

	bearerToken, err := extractBearerToken(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusUnauthorized, "Unauthorized", err}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to retrieve settings", Err: err}
	}

	payload, err := readPayload(r)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusBadRequest,
			Message:    "Invalid Helm install payload",
			Err:        err,
		}
	}

	release, err := handler.installChart(settings.HelmRepositoryURL, endpoint, payload, getProxyUrl(r, endpoint.ID), bearerToken)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to install a chart",
			Err:        err,
		}
	}

	w.WriteHeader(http.StatusCreated)
	return response.JSON(w, release)
}

func (handler *Handler) installChart(repo string, endpoint *portainer.Endpoint, p *installChartPayload, serverURL, bearerToken string) (*release.Release, error) {
	installOpts := helm.InstallOptions{
		Name:      p.Name,
		Chart:     p.Chart,
		Namespace: p.Namespace,
		Repo:      repo,
	}

	if p.Values != "" {
		file, err := os.CreateTemp("", "helm-values")
		if err != nil {
			return nil, err
		}
		defer os.Remove(file.Name())
		_, err = file.WriteString(p.Values)
		if err != nil {
			file.Close()
			return nil, err
		}
		err = file.Close()
		if err != nil {
			return nil, err
		}
		installOpts.ValuesFile = file.Name()
	}

	release, err := handler.HelmPackageManager.Install(installOpts, serverURL, bearerToken)
	if err != nil {
		return nil, err
	}
	return release, nil
}
