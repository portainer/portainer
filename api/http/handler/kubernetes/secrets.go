package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

// @id getKubernetesSecret
// @summary Get Secret
// @description Get a Secret by name for a given namespace
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name where the secret is located"
// @param secret path string true "The secret name to get details for"
// @success 200 {object} models.K8sSecret "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve a secret by name belong in a namespace."
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
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param isUsed query bool true "When set to true, associate the Secrets with the applications that use them"
// @success 200 {array} models.[]K8sSecret "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve all secrets from the cluster."
// @router /kubernetes/{id}/secrets [get]
func (handler *Handler) GetAllKubernetesSecrets(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	secrets, err := handler.getAllKubernetesSecrets(r)
	if err != nil {
		return err
	}

	return response.JSON(w, secrets)
}

// @id getAllKubernetesSecretsCount
// @summary Get Secrets count
// @description Get the count of Secrets for a given namespace
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @success 200 {integer} integer "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 403 "Unauthorized access or operation not allowed."
// @failure 500 "Server error occurred while attempting to retrieve the count of all secrets from the cluster."
// @router /kubernetes/{id}/secrets/count [get]
func (handler *Handler) getAllKubernetesSecretsCount(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	secrets, err := handler.getAllKubernetesSecrets(r)
	if err != nil {
		return err
	}

	return response.JSON(w, len(secrets))
}

func (handler *Handler) getAllKubernetesSecrets(r *http.Request) ([]models.K8sSecret, *httperror.HandlerError) {
	isUsed, err := request.RetrieveBooleanQueryParameter(r, "isUsed", true)
	if err != nil {
		return nil, httperror.BadRequest("an error occurred during the GetAllKubernetesSecrets operation, unable to retrieve isUsed query parameter. Error: ", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetAllKubernetesSecrets operation, unable to prepare kube client. Error: ", httpErr)
	}

	secrets, err := cli.GetSecrets("")
	if err != nil {
		return nil, httperror.InternalServerError("an error occurred during the GetAllKubernetesSecrets operation, unable to get secrets. Error: ", err)
	}

	if isUsed {
		secretsWithApplications, err := cli.CombineSecretsWithApplications(secrets)
		if err != nil {
			return nil, httperror.InternalServerError("an error occurred during the GetAllKubernetesSecrets operation, unable to combine secrets with applications. Error: ", err)
		}

		return secretsWithApplications, nil
	}

	return secrets, nil
}