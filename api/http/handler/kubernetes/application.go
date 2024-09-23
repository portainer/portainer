package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// @id GetApplicationsResources
// @summary Get the total resource requests and limits of all applications
// @description Get the total CPU (cores) and memory requests (MB) and limits of all applications across all namespaces.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {object} models.K8sApplicationResource "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the total resource requests and limits for all applications from the cluster."
// @router /kubernetes/{id}/metrics/applications_resources [get]
func (handler *Handler) getApplicationsResources(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httperror.InternalServerError("an error occurred during the GetApplicationsResources operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	applicationsResources, err := cli.GetApplicationsResource("")
	if err != nil {
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			return httperror.Forbidden("an error occurred during the GetApplicationsResources operation, unable to get the total resource requests and limits for all applications in the namespace. Error: ", err)
		}

		return httperror.InternalServerError("an error occurred during the GetApplicationsResources operation, unable to calculate the total resource requests and limits for all applications in the namespace. Error: ", err)
	}

	return response.JSON(w, applicationsResources)
}

// @id GetAllKubernetesApplications
// @summary Get a list of applications
// @description Get a list of applications. If nodeName is provided, it will return the list of applications running on that node.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param nodeName query string false "Node name"
// @success 200 {array} models.K8sApplication "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve the list of applications from the cluster."
// @router /kubernetes/{id}/applications [get]
func (handler *Handler) GetAllKubernetesApplications(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	applications, err := handler.getAllKubernetesApplications(r)
	if err != nil {
		return err
	}

	return response.JSON(w, applications)
}

// @id GetAllKubernetesApplicationsCount
// @summary Get Applications count
// @description Get the count of Applications across all namespaces in the cluster. If nodeName is provided, it will return the count of applications running on that node.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {integer} integer "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
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
	nodeName, err := request.RetrieveQueryParameter(r, "nodeName", true)
	if err != nil {
		return nil, httperror.BadRequest("an error occurred during the GetAllKubernetesApplications operation, unable to parse the nodeName query parameter. Error: ", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetAllKubernetesServices operation, unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	applications := []models.K8sApplication{}
	if nodeName != "" {
		applications, err = cli.GetApplicationsByNode(nodeName)
		if err != nil {
			if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
				return nil, httperror.Forbidden("an error occurred during the GetAllKubernetesServices operation, unable to get the list of applications. Error: ", err)
			}

			return nil, httperror.InternalServerError("an error occurred during the GetAllKubernetesServices operation, unable to get the list of applications. Error: ", err)
		}
	}

	return applications, nil
}
