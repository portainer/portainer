package namespaces

import (
	"errors"
	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"net/http"
)

type NamespaceCreateOrUpdatePayload struct {
	Name        string `example:"my-scenes" validate:"required"`
	EndpointID  int    `example:"1"`
	ContainerId string `example:"a5254cfe57e2f9cd6bf30062cee119dc4fecb2382ee295d2c2028c15fc421e73"`
}

func (payload *NamespaceCreateOrUpdatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("invalid namespaces name")
	}
	if govalidator.IsNull(payload.ContainerId) {
		return errors.New("invalid namespaces ContainerId")
	}
	return nil
}

// @summary CreateOrUpdate a namespace
// @description Create Or Update a namespace.
// @description **Access policy**: administrator
// @tags namespaces
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body namespaceCreatePayload true "namespace details"
// @success 200 {object} portainer.Namespace "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /namespaces/createOrUpdate [post]
func (handler *Handler) namespaceCreateOrUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload NamespaceCreateOrUpdatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	oldNamespace, err := handler.DataStore.Namespace().NamespaceByContainerID(payload.ContainerId)
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist the namespaces inside the database", Err: err}
	}

	if oldNamespace == nil {
		namespace, err := handler.DataStore.Namespace().Namespace(payload.Name)
		if handler.DataStore.IsErrObjectNotFound(err) || err != nil {
			namespace = &portainer.Namespace{
				Name: payload.Name,
				Containers: map[string]portainer.NamespaceContainer{
					payload.ContainerId: {Used: 0, EndpointID: portainer.EndpointID(payload.EndpointID)},
				},
			}

			if err = handler.DataStore.Namespace().Create(namespace); err != nil {
				return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist the namespaces inside the database", Err: err}
			}
		} else {
			delete(namespace.Containers, payload.ContainerId)

			if _, judge := namespace.Containers[payload.ContainerId]; !judge {
				namespace.Containers[payload.ContainerId] = portainer.NamespaceContainer{
					Used:       0,
					EndpointID: portainer.EndpointID(payload.EndpointID),
				}
			}

			if err = handler.DataStore.Namespace().UpdateNamespace(payload.Name, namespace); err != nil {
				return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist namespace changes inside the database", Err: err}
			}
		}
		return response.JSON(w, namespace)
	} else if oldNamespace.Name == payload.Name {
		if _, judge := oldNamespace.Containers[payload.ContainerId]; !judge {
			oldNamespace.Containers[payload.ContainerId] = portainer.NamespaceContainer{
				Used:       0,
				EndpointID: portainer.EndpointID(payload.EndpointID),
			}
		}

		if err = handler.DataStore.Namespace().UpdateNamespace(payload.Name, oldNamespace); err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist namespace changes inside the database", Err: err}
		}
		return response.JSON(w, oldNamespace)
	} else {
		delete(oldNamespace.Containers, payload.ContainerId)

		namespace, err := handler.DataStore.Namespace().Namespace(payload.Name)
		if handler.DataStore.IsErrObjectNotFound(err) || err != nil {
			namespace = &portainer.Namespace{
				Name: payload.Name,
				Containers: map[string]portainer.NamespaceContainer{
					payload.ContainerId: {Used: 0, EndpointID: portainer.EndpointID(payload.EndpointID)},
				},
			}

			if err = handler.DataStore.Namespace().Create(namespace); err != nil {
				return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist the namespaces inside the database", Err: err}
			}
		} else {
			delete(namespace.Containers, payload.ContainerId)

			if _, judge := namespace.Containers[payload.ContainerId]; !judge {
				namespace.Containers[payload.ContainerId] = portainer.NamespaceContainer{
					Used:       0,
					EndpointID: portainer.EndpointID(payload.EndpointID),
				}
			}

			if err = handler.DataStore.Namespace().UpdateNamespace(payload.Name, namespace); err != nil {
				return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist namespace changes inside the database", Err: err}
			}
		}
		return response.JSON(w, namespace)
	}
}
