package ssl

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
)

type sslUpdatePayload struct {
	// SSL Certificates
	Cert        *string
	Key         *string
	HTTPEnabled *bool
}

func (payload *sslUpdatePayload) Validate(r *http.Request) error {
	if (payload.Cert == nil || payload.Key == nil) && payload.Cert != payload.Key {
		return errors.New("both certificate and key files should be provided")
	}

	return nil
}

// @id SSLUpdate
// @summary Update the ssl settings
// @description Update the ssl settings.
// @description **Access policy**: administrator
// @tags ssl
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body sslUpdatePayload true "SSL Settings"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /ssl [put]
func (handler *Handler) sslUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload sslUpdatePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	if payload.Cert != nil {
		if err := handler.SSLService.SetCertificates([]byte(*payload.Cert), []byte(*payload.Key)); err != nil {
			return httperror.InternalServerError("Failed to save certificate", err)
		}
	}

	if payload.HTTPEnabled != nil {
		if err := handler.SSLService.SetHTTPEnabled(*payload.HTTPEnabled); err != nil {
			return httperror.InternalServerError("Failed to force https", err)
		}
	}

	return response.Empty(w)
}
