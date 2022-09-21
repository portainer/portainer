package kubernetes

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api/database/models"
)

func (handler *Handler) getKubernetesServices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	cli := handler.KubernetesClient
	services, err := cli.GetServices(namespace)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve services",
			err,
		)
	}

	return response.JSON(w, services)
}

func (handler *Handler) createKubernetesService(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	var payload models.K8sServiceInfo
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest(
			"Invalid request payload",
			err,
		)
	}

	cli := handler.KubernetesClient
	err = cli.CreateService(namespace, payload)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve nodes limits",
			err,
		)
	}
	return nil
}

func (handler *Handler) deleteKubernetesServices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli := handler.KubernetesClient

	var payload models.K8sServiceDeleteRequests
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest(
			"Invalid request payload",
			err,
		)
	}

	err = cli.DeleteServices(payload)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve nodes limits",
			err,
		)
	}
	return nil
}

func (handler *Handler) updateKubernetesService(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	namespace, err := request.RetrieveRouteVariableValue(r, "namespace")
	if err != nil {
		return httperror.BadRequest(
			"Invalid namespace identifier route variable",
			err,
		)
	}

	var payload models.K8sServiceInfo
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest(
			"Invalid request payload",
			err,
		)
	}

	cli := handler.KubernetesClient
	err = cli.UpdateService(namespace, payload)
	if err != nil {
		return httperror.InternalServerError(
			"Unable to retrieve nodes limits",
			err,
		)
	}
	return nil
}
