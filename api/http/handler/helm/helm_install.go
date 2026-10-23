package helm

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/kubernetes/validation"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/release"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
	"github.com/rs/zerolog/log"

	"github.com/pkg/errors"
)

type installChartPayload struct {
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
	Chart     string `json:"chart"`
	Repo      string `json:"repo"`
	Values    string `json:"values"`
	Version   string `json:"version"`
	Atomic    bool   `json:"atomic"`
}

var errChartNameInvalid = errors.New("invalid chart name. " +
	"Chart name must consist of lower case alphanumeric characters, '-' or '.'," +
	" and must start and end with an alphanumeric character",
)

// @id HelmInstall
// @summary Install Helm Chart
// @description
// @description **Access policy**: authenticated
// @tags helm
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param payload body installChartPayload true "Chart details"
// @param dryRun query bool false "Dry run"
// @success 201 {object} release.Release "Created"
// @failure 400 "Invalid request payload"
// @failure 401 "Unauthorized"
// @failure 404 "Environment(Endpoint) or ServiceAccount not found"
// @failure 500 "Server error"
// @router /endpoints/{id}/kubernetes/helm [post]
func (handler *Handler) helmInstall(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	dryRun, err := request.RetrieveBooleanQueryParameter(r, "dryRun", true)
	if err != nil {
		return httperror.BadRequest("Invalid dryRun query parameter", err)
	}

	var payload installChartPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid Helm install payload", err)
	}

	if err := ssrf.CheckURL(r.Context(), payload.Repo); err != nil {
		return httperror.BadRequest("Repository URL blocked by SSRF policy", err)
	}

	release, err := handler.installChart(r, payload, dryRun)
	if err != nil {
		return httperror.InternalServerError("Unable to install a chart", err)
	}

	return response.JSONWithStatus(w, release, http.StatusCreated)
}

func (p *installChartPayload) Validate(_ *http.Request) error {
	var required []string
	if p.Repo == "" {
		required = append(required, "repo")
	}

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

	if err := validation.IsDNS1123Subdomain(p.Name); err != nil {
		return errChartNameInvalid
	}

	return nil
}

func (handler *Handler) installChart(r *http.Request, p installChartPayload, dryRun bool) (*release.Release, error) {
	clusterAccess, httperr := handler.getHelmClusterAccess(r)
	if httperr != nil {
		return nil, httperr.Err
	}

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return nil, errors.Wrap(err, "unable to retrieve user details from authentication token")
	}

	var username string
	if err := handler.dataStore.ViewTx(func(tx dataservices.DataStoreTx) error {
		user, err := tx.User().Read(tokenData.ID)
		if err != nil {
			return errors.Wrap(err, "unable to load user information from the database")
		}
		username = user.Username
		return nil
	}); err != nil {
		return nil, err
	}

	installOpts := options.InstallOptions{
		Name:                    p.Name,
		Chart:                   p.Chart,
		Version:                 p.Version,
		Namespace:               p.Namespace,
		Repo:                    p.Repo,
		Atomic:                  p.Atomic,
		DryRun:                  dryRun,
		KubernetesClusterAccess: clusterAccess,
		HelmAppLabels:           kubernetes.GetHelmAppLabels(p.Name, username),
	}

	if p.Values != "" {
		file, err := os.CreateTemp("", "helm-values")
		if err != nil {
			return nil, err
		}
		defer func() {
			if err := os.Remove(file.Name()); err != nil {
				log.Warn().Err(err).Msg("failed to remove temporary helm values file")
			}
		}()

		if _, err := file.WriteString(p.Values); err != nil {
			logs.CloseAndLogErr(file)
			return nil, err
		}

		if err := file.Close(); err != nil {
			return nil, err
		}

		installOpts.ValuesFile = file.Name()
	}

	release, err := handler.helmPackageManager.Upgrade(installOpts)
	if err != nil {
		return nil, err
	}

	return release, nil
}
