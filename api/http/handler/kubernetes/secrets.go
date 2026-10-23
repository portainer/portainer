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
		if k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "GetKubernetesSecret").Str("namespace", namespace).Str("secret", secretName).Msg("Unauthorized access to the Kubernetes API")
			return httperror.Forbidden("unauthorized access to the Kubernetes API. Error: ", err)
		}

		if k8serrors.IsNotFound(err) {
			log.Error().Err(err).Str("context", "GetKubernetesSecret").Str("namespace", namespace).Str("secret", secretName).Msg("Unable to find the secret")
			return httperror.NotFound("unable to find the secret. Error: ", err)
		}

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

// @id CreateKubernetesSecret
// @summary Create a Secret
// @description Create a Secret in the given namespace. Data values are sent as plain
// @description strings and encoded server-side. The response carries the created
// @description Secret's metadata only, not its data.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name where the secret is created"
// @param body body models.K8sSecretWriteRequest true "Secret definition"
// @success 200 {object} models.K8sSecret "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 409 "A secret with the same name already exists in the namespace."
// @failure 500 "Server error occurred while attempting to create the secret."
// @router /kubernetes/{id}/namespaces/{namespace}/secrets [post]
func (handler *Handler) createKubernetesSecret(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "CreateKubernetesSecret").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("unable to retrieve namespace identifier route variable. Error: ", err)
	}

	var payload models.K8sSecretWriteRequest
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		log.Error().Err(err).Str("context", "CreateKubernetesSecret").Str("namespace", namespace).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("unable to decode and validate the request payload. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "CreateKubernetesSecret").Str("namespace", namespace).Str("secret", payload.Name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	secret, err := cli.CreateSecret(namespace, payload)
	if err != nil {
		return writeErrorResponse(err, "CreateKubernetesSecret", namespace, payload.Name, "create the secret")
	}

	return response.JSON(w, secret)
}

// @id UpdateKubernetesSecret
// @summary Update a Secret
// @description Update a Secret in the given namespace. A nil field leaves the live value
// @description untouched, so an empty map clears it, and the secret type cannot be
// @description changed. The response carries the updated Secret's metadata only.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name where the secret is located"
// @param secret path string true "The secret name to update"
// @param body body models.K8sSecretWriteRequest true "Secret definition"
// @success 200 {object} models.K8sSecret "Success"
// @failure 400 "Invalid request payload, such as missing required fields, fields not meeting validation criteria, or a payload name that does not match the route."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find the secret to update."
// @failure 500 "Server error occurred while attempting to update the secret."
// @router /kubernetes/{id}/namespaces/{namespace}/secrets/{secret} [put]
func (handler *Handler) updateKubernetesSecret(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "UpdateKubernetesSecret").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("unable to retrieve namespace identifier route variable. Error: ", err)
	}

	secretName, err := request.RetrieveRouteVariableValue(r, "secret")
	if err != nil {
		log.Error().Err(err).Str("context", "UpdateKubernetesSecret").Str("namespace", namespace).Msg("Unable to retrieve secret identifier route variable")
		return httperror.BadRequest("unable to retrieve secret identifier route variable. Error: ", err)
	}

	var payload models.K8sSecretWriteRequest
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		log.Error().Err(err).Str("context", "UpdateKubernetesSecret").Str("namespace", namespace).Str("secret", secretName).Msg("Unable to decode and validate the request payload")
		return httperror.BadRequest("unable to decode and validate the request payload. Error: ", err)
	}

	if payload.Name != secretName {
		log.Error().Str("context", "UpdateKubernetesSecret").Str("namespace", namespace).Str("secret", secretName).Str("payload_name", payload.Name).Msg("The payload name does not match the route")
		return httperror.BadRequest("the secret name in the request payload does not match the one in the route", nil)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "UpdateKubernetesSecret").Str("namespace", namespace).Str("secret", secretName).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	secret, err := cli.UpdateSecret(namespace, payload)
	if err != nil {
		return writeErrorResponse(err, "UpdateKubernetesSecret", namespace, secretName, "update the secret")
	}

	return response.JSON(w, secret)
}

// @id DeleteKubernetesSecret
// @summary Delete a Secret
// @description Delete a Secret in the given namespace.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment identifier"
// @param namespace path string true "The namespace name where the secret is located"
// @param secret path string true "The secret name to delete"
// @success 204 "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find the secret to delete."
// @failure 500 "Server error occurred while attempting to delete the secret."
// @router /kubernetes/{id}/namespaces/{namespace}/secrets/{secret} [delete]
func (handler *Handler) deleteKubernetesSecret(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		log.Error().Err(err).Str("context", "DeleteKubernetesSecret").Msg("Unable to retrieve namespace identifier route variable")
		return httperror.BadRequest("unable to retrieve namespace identifier route variable. Error: ", err)
	}

	secretName, err := request.RetrieveRouteVariableValue(r, "secret")
	if err != nil {
		log.Error().Err(err).Str("context", "DeleteKubernetesSecret").Str("namespace", namespace).Msg("Unable to retrieve secret identifier route variable")
		return httperror.BadRequest("unable to retrieve secret identifier route variable. Error: ", err)
	}

	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().Err(httpErr).Str("context", "DeleteKubernetesSecret").Str("namespace", namespace).Str("secret", secretName).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("unable to get a Kubernetes client for the user. Error: ", httpErr)
	}

	if err := cli.DeleteSecret(namespace, secretName); err != nil {
		return writeErrorResponse(err, "DeleteKubernetesSecret", namespace, secretName, "delete the secret")
	}

	return response.Empty(w)
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
		err = cli.SetSecretsIsUsed(&secrets)
		if err != nil {
			log.Error().Err(err).Str("context", "GetAllKubernetesSecrets").Msg("Unable to combine secrets with associated applications")
			return nil, httperror.InternalServerError("unable to combine secrets with associated applications. Error: ", err)
		}
	}

	return secrets, nil
}
