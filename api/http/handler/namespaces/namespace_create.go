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

type NamespaceCreatePayload struct {
	Name string `example:"my-namespaces" validate:"required"`
}

func (payload *NamespaceCreatePayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("invalid namespaces name")
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
// @router /namespaces/create [post]
func (handler *Handler) namespaceCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload NamespaceCreatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	namespace, err := handler.DataStore.Namespace().Namespace(payload.Name)
	if handler.DataStore.IsErrObjectNotFound(err) || err != nil {
		namespace = &portainer.Namespace{
			Name: payload.Name,
		}

		if err = handler.DataStore.Namespace().Create(namespace); err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to persist the namespaces inside the database", Err: err}
		}
	} else {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "The namespace of the repeated inside the database", Err: err}
	}
	return response.JSON(w, namespace)
}
