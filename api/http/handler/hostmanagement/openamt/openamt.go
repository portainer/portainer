package openamt

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/sirupsen/logrus"
	"software.sslmate.com/src/go-pkcs12"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
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
			return errors.New("certificate file must be provided")
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
// @summary Enable Portainer's OpenAMT capabilities
// @description Enable Portainer's OpenAMT capabilities
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
// @router /open_amt [post]
func (handler *Handler) openAMTConfigureDefault(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload openAMTConfigureDefaultPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		logrus.WithError(err).Error("Invalid request payload")
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	if payload.EnableOpenAMT {
		certificateErr := validateCertificate(payload.CertFileText, payload.CertPassword)
		if certificateErr != nil {
			return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Error validating certificate", Err: certificateErr}
		}

		err = handler.enableOpenAMT(payload)
		if err != nil {
			return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Error enabling OpenAMT", Err: err}
		}
		return response.Empty(w)
	}

	err = handler.disableOpenAMT()
	if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Error disabling OpenAMT", Err: err}
	}
	return response.Empty(w)
}

func validateCertificate(certificateRaw string, certificatePassword string) error {
	certificateData, err := base64.StdEncoding.Strict().DecodeString(certificateRaw)
	if err != nil {
		return err
	}

	_, certificate, _, err := pkcs12.DecodeChain(certificateData, certificatePassword)
	if err != nil {
		return err
	}

	if certificate == nil {
		return errors.New("certificate could not be decoded")
	}

	issuer := certificate.Issuer.CommonName
	if !isValidIssuer(issuer) {
		return fmt.Errorf("certificate issuer is invalid: %v", issuer)
	}

	return nil
}

func isValidIssuer(issuer string) bool {
	formattedIssuer := strings.ToLower(strings.ReplaceAll(issuer, " ", ""))
	return strings.Contains(formattedIssuer, "comodo") ||
		strings.Contains(formattedIssuer, "digicert") ||
		strings.Contains(formattedIssuer, "entrust") ||
		strings.Contains(formattedIssuer, "godaddy")
}

func (handler *Handler) enableOpenAMT(configurationPayload openAMTConfigureDefaultPayload) error {
	configuration := portainer.OpenAMTConfiguration{
		Enabled: true,
		MPSURL:  configurationPayload.MPSURL,
		Credentials: portainer.MPSCredentials{
			MPSUser:     configurationPayload.MPSUser,
			MPSPassword: configurationPayload.MPSPassword,
		},
		DomainConfiguration: portainer.DomainConfiguration{
			CertFileText: configurationPayload.CertFileText,
			CertPassword: configurationPayload.CertPassword,
			DomainName:   configurationPayload.DomainName,
		},
	}

	if configurationPayload.UseWirelessConfig {
		configuration.WirelessConfiguration = &portainer.WirelessConfiguration{
			AuthenticationMethod: configurationPayload.WifiAuthenticationMethod,
			EncryptionMethod:     configurationPayload.WifiEncryptionMethod,
			SSID:                 configurationPayload.WifiSSID,
			PskPass:              configurationPayload.WifiPskPass,
		}
	}

	err := handler.OpenAMTService.ConfigureDefault(configuration)
	if err != nil {
		logrus.WithError(err).Error("error configuring OpenAMT server")
		return err
	}

	err = handler.saveConfiguration(configuration)
	if err != nil {
		logrus.WithError(err).Error("error updating OpenAMT configurations")
		return err
	}

	logrus.Info("OpenAMT successfully enabled")
	return nil
}

func (handler *Handler) saveConfiguration(configuration portainer.OpenAMTConfiguration) error {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return err
	}

	configuration.Credentials.MPSToken = ""

	settings.OpenAMTConfiguration = configuration
	err = handler.DataStore.Settings().UpdateSettings(settings)
	if err != nil {
		return err
	}

	return nil
}

func (handler *Handler) disableOpenAMT() error {

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return err
	}

	settings.OpenAMTConfiguration.Enabled = false

	err = handler.DataStore.Settings().UpdateSettings(settings)
	if err != nil {
		return err
	}

	logrus.Info("OpenAMT successfully disabled")
	return nil
}


type Devices struct {
	Devices []portainer.OpenAMTDeviceInformation
}

// @id OpenAMTDevices
// @summary Fetch OpenAMT managed devices information for endpoint
// @description Fetch OpenAMT managed devices information for endpoint
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /open_amt/{id}/devices [get]
func (handler *Handler) OpenAMTDevices(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid environment identifier route variable", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{StatusCode: http.StatusNotFound, Message: "Unable to find an endpoint with the specified identifier inside the database", Err: err}
	} else if err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Unable to find an endpoint with the specified identifier inside the database", Err: err}
	}

	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve settings from the database", err}
	}

	// TODO for testing
	if endpoint.ID == 25 {
		endpoint.AMTDeviceGUID = "4c4c4544-004b-3910-8037-b6c04f504633"
	}

	device, err := handler.OpenAMTService.DeviceInformation(settings.OpenAMTConfiguration, endpoint.AMTDeviceGUID)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve device information", err}
	}

	devicesInformation := Devices{
		Devices: []portainer.OpenAMTDeviceInformation{
			*device,
		},
	}

	return response.JSON(w, devicesInformation)
}