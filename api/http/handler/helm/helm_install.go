package helm

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/portainer/libhelm/options"
	"github.com/portainer/libhelm/release"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/security"
	validation "github.com/portainer/portainer/api/kubernetes/validation"
)

type installChartPayload struct {
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
	Chart     string `json:"chart"`
	Values    string `json:"values"`
}

var errChartNameInvalid = errors.New("invalid chart name. " +
	"Chart name must consist of lower case alphanumeric characters, '-' or '.'," +
	" and must start and end with an alphanumeric character",
)

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

	if errs := validation.IsDNS1123Subdomain(p.Name); len(errs) > 0 {
		return errChartNameInvalid
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
	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint on request context", err}
	}

	bearerToken, err := security.ExtractBearerToken(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusUnauthorized, "Unauthorized", err}
	}

	settings, err := handler.dataStore.Settings().Settings()
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

	release, err := handler.installChart(settings.HelmRepositoryURL, endpoint, payload, bearerToken)
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

func (handler *Handler) installChart(repo string, endpoint *portainer.Endpoint, p *installChartPayload, bearerToken string) (*release.Release, error) {
	clusterAccess := handler.kubeConfigService.GetKubeConfigInternal(endpoint.ID, bearerToken)
	installOpts := options.InstallOptions{
		Name:      p.Name,
		Chart:     p.Chart,
		Namespace: p.Namespace,
		Repo:      repo,
		KubernetesClusterAccess: &options.KubernetesClusterAccess{
			ClusterServerURL:         clusterAccess.ClusterServerURL,
			CertificateAuthorityFile: clusterAccess.CertificateAuthorityFile,
			AuthToken:                clusterAccess.AuthToken,
		},
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

	release, err := handler.helmPackageManager.Install(installOpts)
	if err != nil {
		return nil, err
	}
	return release, nil
}
