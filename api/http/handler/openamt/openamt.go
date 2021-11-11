package openamt

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

type openAMTSubmitPayload struct {
	EnableOpenAMT            *bool
	CertFileText             *string
	CertPassword             *string
	DomainName               *string
	UseWirelessConfig        *bool
	WifiAuthenticationMethod *string
	WifiEncryptionMethod     *string
	WifiSSID                 *string
	WifiPskPass              *string
}

func (payload *openAMTSubmitPayload) Validate(r *http.Request) error {
	return nil //TODO remove
	if *payload.EnableOpenAMT {
		if payload.DomainName == nil || *payload.DomainName == "" {
			return errors.New("domain name must be provided")
		}
		if payload.CertFileText == nil || *payload.CertFileText == "" {
			return errors.New("certificate file must be provided")
		}
		if payload.CertPassword == nil || *payload.CertPassword == "" {
			return errors.New("certificate password must be provided")
		}
		if *payload.UseWirelessConfig {
			if payload.WifiAuthenticationMethod == nil || *payload.WifiAuthenticationMethod == "" {
				return errors.New("wireless authentication method must be provided")
			}
			if payload.WifiEncryptionMethod == nil || *payload.WifiEncryptionMethod == "" {
				return errors.New("wireless encryption method must be provided")
			}
			if payload.WifiSSID == nil || *payload.WifiSSID == "" {
				return errors.New("wireless config SSID must be provided")
			}
			if payload.WifiPskPass == nil || *payload.WifiPskPass == "" {
				return errors.New("wireless config PSK passphrase must be provided")
			}
		}
	}

	return nil
}

// @id OpenAMTSubmit
// @summary Enable OpenAMT capabilities
// @description Enable OpenAMT capabilities
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @accept json
// @produce json
// @param body body openAMTSubmitPayload true "OpenAMT Settings"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /open-amt [put]
func (handler *Handler) openAMTSubmit(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload openAMTSubmitPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	if *payload.EnableOpenAMT {
		err := handler.OpenAMTService.ConfigureDefault()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "error configuring OpenAMT server", err}
		}

		return &httperror.HandlerError{http.StatusNotImplemented, "not implemented", errors.New("not implemented")}
	}

	return response.Empty(w)
}
