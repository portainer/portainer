package openamt

import (
	"errors"
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
)

type openAMTConfigureDefaultPayload struct {
	EnableOpenAMT            bool
	CertFileText             string
	CertPassword             string
	DomainName               string
	UseWirelessConfig        bool
	WifiAuthenticationMethod string
	WifiEncryptionMethod     string
	WifiSSID                 string
	WifiPskPass              string
}

func (payload *openAMTConfigureDefaultPayload) Validate(r *http.Request) error {
	if payload.EnableOpenAMT {
		if payload.DomainName == "" {
			return errors.New("domain name must be provided")
		}
		if payload.CertFileText == "" {
			//return errors.New("certificate file must be provided") TODO
		}
		if payload.CertPassword == "" {
			//return errors.New("certificate password must be provided") TODO
		}
		if payload.UseWirelessConfig {
			if payload.WifiAuthenticationMethod == "" {
				return errors.New("wireless authentication method must be provided")
			}
			if payload.WifiEncryptionMethod == "" {
				return errors.New("wireless encryption method must be provided")
			}
			if payload.WifiSSID == "" {
				return errors.New("wireless config SSID must be provided")
			}
			if payload.WifiPskPass == "" {
				return errors.New("wireless config PSK passphrase must be provided")
			}
		}
	}

	return nil
}

// @id OpenAMTConfigureDefault
// @summary Enable OpenAMT capabilities
// @description Enable OpenAMT capabilities
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @accept json
// @produce json
// @param body body openAMTConfigureDefaultPayload true "OpenAMT Settings"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /open-amt [put]
func (handler *Handler) openAMTConfigureDefault(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload openAMTConfigureDefaultPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	if payload.EnableOpenAMT {
		err := handler.OpenAMTService.ConfigureDefault(payload.CertFileText, payload.CertPassword, payload.DomainName, payload.UseWirelessConfig, payload.WifiAuthenticationMethod, payload.WifiEncryptionMethod, payload.WifiSSID, payload.WifiPskPass)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "error configuring OpenAMT server", err}
		}
	}

	return response.Empty(w)
}
