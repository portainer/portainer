package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id GetApplicationsResources
// @summary Get the total CPU (cores) and memory requests (MB) and limits of all applications across all namespaces
// @description Get the total CPU (cores) and memory requests (MB) and limits of all applications across all namespaces
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {object} models.K8sApplicationResource "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 403 "Permission denied"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /kubernetes/{id}/metrics/applications_resources [get]
func (handler *Handler) getApplicationsResources(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getApplicationsResources").Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	applicationsResources, err := cli.GetApplicationsResource("")
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			log.Error().Err(err).Str("context", "getApplicationsResources").Msg("Unable to get the total resource requests and limits for all applications in the namespace")
			return httperror.Unauthorized("Unable to get the total resource requests and limits for all applications in the namespace", err)
		}

		if k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getApplicationsResources").Msg("Unable to get the total resource requests and limits for all applications in the namespace")
			return httperror.Forbidden("Unable to get the total resource requests and limits for all applications in the namespace", err)
		}

		log.Error().Err(err).Str("context", "getApplicationsResources").Msg("Unable to calculate the total resource requests and limits for all applications in the namespace")
		return httperror.InternalServerError("Unable to calculate the total resource requests and limits for all applications in the namespace", err)
	}

	return response.JSON(w, applicationsResources)
}

// @id GetAllKubernetesApplications
// @summary Get a list of applications across all namespaces in the cluster. If the nodeName is provided, it will return the applications running on that node.
// @description Get a list of applications across all namespaces in the cluster. If the nodeName is provided, it will return the applications running on that node.
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param namespace query string true "Namespace name"
// @param nodeName query string true "Node name"
// @param withDependencies query boolean false "Include dependencies in the response"
// @success 200 {array} models.K8sApplication "Success"
// @failure 400 "Invalid request"
// @failure 401 "Unauthorized"
// @failure 403 "Permission denied"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /kubernetes/{id}/applications [get]
func (handler *Handler) GetAllKubernetesApplications(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	applications, err := handler.getAllKubernetesApplications(r)
	if err != nil {
		return err
	}

	return response.JSON(w, applications)
}

// @id getAllKubernetesApplicationsCount
// @summary Get Applications count
// @description Get the count of Applications across all namespaces in the cluster. If the nodeName is provided, it will return the count of applications running on that node.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {integer} integer "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve the count of all applications from the cluster."
// @router /kubernetes/{id}/applications/count [get]
func (handler *Handler) getAllKubernetesApplicationsCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	applications, err := handler.getAllKubernetesApplications(r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(applications))
}

func (handler *Handler) getAllKubernetesApplications(r *http.Request) ([]models.K8sApplication, *httperror.HandlerError) {
	namespace, err := request.RetrieveQueryParameter(r, "namespace", true)
	if err != nil {
		log.Error().Err(err).Str("context", "getAllKubernetesApplications").Msg("Unable to parse the namespace query parameter")
		return nil, httperror.BadRequest("Unable to parse the namespace query parameter", err)
	}

	withDependencies, err := request.RetrieveBooleanQueryParameter(r, "withDependencies", true)
	if err != nil {
		log.Error().Err(err).Str("context", "getAllKubernetesApplications").Msg("Unable to parse the withDependencies query parameter")
		return nil, httperror.BadRequest("Unable to parse the withDependencies query parameter", err)
	}

	nodeName, err := request.RetrieveQueryParameter(r, "nodeName", true)
	if err != nil {
		log.Error().Err(err).Str("context", "getAllKubernetesApplications").Msg("Unable to parse the nodeName query parameter")
		return nil, httperror.BadRequest("Unable to parse the nodeName query parameter", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "getAllKubernetesApplications").Str("namespace", namespace).Str("nodeName", nodeName).Msg("Unable to get a Kubernetes client for the user")
		return nil, httperror.InternalServerError("Unable to get a Kubernetes client for the user", httpErr)
	}

	applications, err := cli.GetApplications(namespace, nodeName, withDependencies)
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			log.Error().Err(err).Str("context", "getAllKubernetesApplications").Str("namespace", namespace).Str("nodeName", nodeName).Msg("Unable to get the list of applications")
			return nil, httperror.Unauthorized("Unable to get the list of applications", err)
		}

		log.Error().Err(err).Str("context", "getAllKubernetesApplications").Str("namespace", namespace).Str("nodeName", nodeName).Msg("Unable to get the list of applications")
		return nil, httperror.InternalServerError("Unable to get the list of applications", err)
	}

	return applications, nil
}
