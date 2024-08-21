package kubernetes

import (
	"net/http"

	"github.com/portainer/portainer/api/http/middlewares"
	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id getKubernetesSecret
// @summary Get Secret
// @description Get a Secret by name for a given namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "Namespace name"
// @param secret path string true "Secret name"
// @success 200 {object} K8sSecret "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/namespaces/{namespace}/secrets/{secret} [get]
func (handler *Handler) getKubernetesSecret(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesSecret operation, unable to retrieve namespace identifier route variable. Error: ", err)
	}

	secretName, err := request.RetrieveRouteVariableValue(r, "secret")
	if err != nil {
		return httperror.BadRequest("an error occurred during the GetKubernetesSecret operation, unable to retrieve secret identifier route variable. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return httpErr
	}

	secret, err := cli.GetSecret(namespace, secretName)
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesSecret operation, unable to get secret. Error: ", err)
	}

	secretWithApplication, err := cli.CombineSecretWithApplications(secret)
	if err != nil {
		return httperror.InternalServerError("an error occurred during the GetKubernetesSecret operation, unable to combine secret with applications. Error: ", err)
	}

	return response.JSON(w, secretWithApplication)
}

// @id GetKubernetesSecrets
// @summary Get Secrets
// @description Get all Secrets for a given namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param isUsed query bool false "When set to true, associate the Secrets with the applications that use them"
// @success 200 {array} []K8sSecret "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/secrets [get]
func (handler *Handler) GetKubernetesSecrets(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	secrets, err := handler.getKubernetesSecrets(r)
	if err != nil {
		return err
	}

	return response.JSON(w, secrets)
}

// @id getKubernetesSecretsCount
// @summary Get Secrets count
// @description Get the count of Secrets for a given namespace
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {object} map[string]int "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /kubernetes/{id}/secrets/count [get]
func (handler *Handler) getKubernetesSecretsCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	secrets, err := handler.getKubernetesSecrets(r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(secrets))
}

func (handler *Handler) getKubernetesSecrets(r *http.Request) ([]models.K8sSecret, *httperror.HandlerError) {
	isUsed, err := request.RetrieveBooleanQueryParameter(r, "isUsed", false)
	if err != nil {
		return nil, httperror.BadRequest("an error occurred during the getKubernetesSecrets operation, unable to retrieve isUsed query parameter. Error: ", err)
	}

	endpoint, err := middlewares.FetchEndpoint(r)
	if err != nil {
		return nil, httperror.NotFound("an error occurred during the getKubernetesSecrets operation, unable to fetch endpoint. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		return nil, httpErr
	}

	pcli, err := handler.KubernetesClientFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the getKubernetesSecrets operation, unable to get privileged kube client for combining services with applications. Error: ", err)
	}
	pcli.IsKubeAdmin = cli.IsKubeAdmin
	pcli.NonAdminNamespaces = cli.NonAdminNamespaces

	secrets, err := cli.GetSecrets("")
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the getKubernetesSecrets operation, unable to get secrets. Error: ", err)
	}

	if isUsed {
		secretsWithApplications, err := pcli.CombineSecretsWithApplications(secrets)
		if err != nil {
			return nil, httperror.InternalServerError("an error occurred during the getKubernetesSecrets operation, unable to combine secrets with applications. Error: ", err)
		}

		return secretsWithApplications, nil
	}

	return secrets, nil
}
