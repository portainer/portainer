package kubernetes

import (
	"net/http"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/rs/zerolog/log"
)

// @id GetKubernetesSecret
// @summary Get a Secret
// @description Get a Secret by name for a given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name where the secret is located"
// @param secret path string true "The secret name to get details for"
// @success 200 {object} models.K8sSecret "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve a secret by name belong in a namespace."
// @router /kubernetes/{id}/namespaces/{namespace}/secrets/{secret} [get]
func (handler *Handler) getKubernetesSecret(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesSecret").Str("namespace", namespace).Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("unable to retrieve namespace identifier route variable. Error: ", err)
	}

	secretName, err := request.RetrieveRouteVariableValue(r, "secret")
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesSecret").Str("namespace", namespace).Msg("Unable to retrieve secret identifier route variable")
		return httperror.BadRequest("unable to retrieve secret identifier route variable. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetKubernetesSecret").Str("namespace", namespace).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	secret, err := cli.GetSecret(namespace, secretName)
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesSecret").Str("namespace", namespace).Str("secret", secretName).Msg("Unable to get secret")
		return httperror.InternalServerError("unable to get secret. Error: ", err)
	}

	secretWithApplication, err := cli.CombineSecretWithApplications(secret)
	if err != nil {
		log.Error().Err(err).Str("context", "GetKubernetesSecret").Str("namespace", namespace).Str("secret", secretName).Msg("Unable to combine secret with associated applications")
		return httperror.InternalServerError("unable to combine secret with associated applications. Error: ", err)
	}

	return response.JSON(w, secretWithApplication)
}

// @id GetKubernetesSecrets
// @summary Get a list of Secrets
// @description Get a list of Secrets for a given namespace. If isUsed is set to true, information about the applications that use the secrets is also returned.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param isUsed query bool true "When set to true, associate the Secrets with the applications that use them"
// @success 200 {array} models.K8sSecret "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to retrieve all secrets from the cluster."
// @router /kubernetes/{id}/secrets [get]
func (handler *Handler) GetAllKubernetesSecrets(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	secrets, err := handler.getAllKubernetesSecrets(r)
	if err != nil {
		return err
	}

	return response.JSON(w, secrets)
}

// @id GetKubernetesSecretsCount
// @summary Get Secrets count
// @description Get the count of Secrets across all namespaces that the user has access to.
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
		log.Error().Err(err).Str("context", "GetAllKubernetesSecrets").Msg("Unable to retrieve isUsed query parameter")
		return nil, httperror.BadRequest("unable to retrieve isUsed query parameter. Error: ", err)
	}

	cli, httpErr := handler.prepareKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "GetAllKubernetesSecrets").Msg("Unable to prepare kube client")
		return nil, httperror.InternalServerError("unable to prepare kube client. Error: ", httpErr)
	}

	secrets, err := cli.GetSecrets("")
	if err != nil {
		log.Error().Err(err).Str("context", "GetAllKubernetesSecrets").Msg("Unable to get secrets")
		return nil, httperror.InternalServerError("unable to get secrets. Error: ", err)
	}

	if isUsed {
		secretsWithApplications, err := cli.CombineSecretsWithApplications(secrets)
		if err != nil {
			log.Error().Err(err).Str("context", "GetAllKubernetesSecrets").Msg("Unable to combine secrets with associated applications")
			return nil, httperror.InternalServerError("unable to combine secrets with associated applications. Error: ", err)
		}

		return secretsWithApplications, nil
	}

	return secrets, nil
}
