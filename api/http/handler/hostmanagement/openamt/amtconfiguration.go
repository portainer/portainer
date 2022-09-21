package openamt

import (
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"strings"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"

	"github.com/rs/zerolog/log"
	"software.sslmate.com/src/go-pkcs12"
)

type openAMTConfigurePayload struct {
	Enabled          bool
	MPSServer        string
	MPSUser          string
	MPSPassword      string
	DomainName       string
	CertFileName     string
	CertFileContent  string
	CertFilePassword string
}

func (payload *openAMTConfigurePayload) Validate(r *http.Request) error {
	if payload.Enabled {
		if payload.MPSServer == "" {
			return errors.New("MPS Server must be provided")
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
		if payload.CertFileContent == "" {
			return errors.New("certificate file must be provided")
		}
		if payload.CertFileName == "" {
			return errors.New("certificate file name must be provided")
		}
		if payload.CertFilePassword == "" {
			return errors.New("certificate password must be provided")
		}
	}

	return nil
}

// @id OpenAMTConfigure
// @summary Enable Portainer's OpenAMT capabilities
// @description Enable Portainer's OpenAMT capabilities
// @description **Access policy**: administrator
// @tags intel
// @security jwt
// @accept json
// @produce json
// @param body body openAMTConfigurePayload true "OpenAMT Settings"
// @success 204 "Success"
// @failure 400 "Invalid request"
// @failure 403 "Permission denied to access settings"
// @failure 500 "Server error"
// @router /open_amt [post]
func (handler *Handler) openAMTConfigure(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload openAMTConfigurePayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		log.Error().Err(err).Msg("invalid request payload")

		return httperror.BadRequest("Invalid request payload", err)
	}

	if payload.Enabled {
		certificateErr := validateCertificate(payload.CertFileContent, payload.CertFilePassword)
		if certificateErr != nil {
			return httperror.BadRequest("Error validating certificate", certificateErr)
		}

		err = handler.enableOpenAMT(payload)
		if err != nil {
			return httperror.BadRequest("Error enabling OpenAMT", err)
		}
		return response.Empty(w)
	}

	err = handler.disableOpenAMT()
	if err != nil {
		return httperror.BadRequest("Error disabling OpenAMT", err)
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

func (handler *Handler) enableOpenAMT(configurationPayload openAMTConfigurePayload) error {
	configuration := portainer.OpenAMTConfiguration{
		Enabled:          true,
		MPSServer:        configurationPayload.MPSServer,
		MPSUser:          configurationPayload.MPSUser,
		MPSPassword:      configurationPayload.MPSPassword,
		CertFileContent:  configurationPayload.CertFileContent,
		CertFileName:     configurationPayload.CertFileName,
		CertFilePassword: configurationPayload.CertFilePassword,
		DomainName:       configurationPayload.DomainName,
	}

	err := handler.OpenAMTService.Configure(configuration)
	if err != nil {
		log.Error().Err(err).Msg("error configuring OpenAMT server")

		return err
	}

	err = handler.saveConfiguration(configuration)
	if err != nil {
		log.Error().Err(err).Msg("error updating OpenAMT configurations")

		return err
	}

	log.Info().Msg("OpenAMT successfully enabled")

	return nil
}

func (handler *Handler) saveConfiguration(configuration portainer.OpenAMTConfiguration) error {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return err
	}

	configuration.MPSToken = ""

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

	log.Info().Msg("OpenAMT successfully disabled")

	return nil
}
