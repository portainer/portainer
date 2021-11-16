package openamt

import (
	"errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/sirupsen/logrus"
	"net/http"
)

type openAMTConfigureDefaultPayload struct {
	EnableOpenAMT            bool
	MPSURL                   string
	MPSUser                  string
	MPSPassword              string
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
		if payload.MPSURL == "" {
			return errors.New("MPS Url must be provided")
		}
		if payload.MPSUser == "" {
			return errors.New("MPS User must be provided")
		}
		if payload.MPSPassword == "" {
			return errors.New("MPS Password must be provided")
		}
		if payload.DomainName == "" {
			return errors.New("domain name must be provided")
		}
		if payload.CertFileText == "" {
			//return errors.New("certificate file must be provided") TODO
		}
		if payload.CertPassword == "" {
			return errors.New("certificate password must be provided")
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
		logrus.WithError(err).Error("Invalid request payload")
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	if payload.EnableOpenAMT {
		configuration := portainer.OpenAMTConfiguration{
			MPSURL: payload.MPSURL,
			Credentials: portainer.MPSCredentials{
				MPSUser:     payload.MPSUser,
				MPSPassword: payload.MPSPassword,
			},
			DomainConfiguration: portainer.DomainConfiguration{
				CertFileText: payload.CertFileText,
				CertPassword: payload.CertPassword,
				DomainName:   payload.DomainName,
			},
			WirelessConfiguration: portainer.WirelessConfiguration{
				UseWirelessConfig:    payload.UseWirelessConfig,
				AuthenticationMethod: payload.WifiAuthenticationMethod,
				EncryptionMethod:     payload.WifiEncryptionMethod,
				SSID:                 payload.WifiSSID,
				PskPass:              payload.WifiPskPass,
			},
		}

		err = handler.OpenAMTService.ConfigureDefault(configuration)
		if err != nil {
			logrus.WithError(err).Error("error configuring OpenAMT server")
			return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "error configuring OpenAMT server", Err: err}
		}
	}

	logrus.Info("OpenAMT enabled")
	return response.Empty(w)
}
