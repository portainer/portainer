package registries

import (
	"context"
	"errors"
	"net/http"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/fips"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/portainer/portainer/pkg/liboras"

	"github.com/rs/zerolog/log"
	"oras.land/oras-go/v2/registry/remote/errcode"
)

type registryPingPayload struct {
	// Registry Type. Valid values are:
	//	1 (Quay.io),
	//	2 (Azure container registry),
	//	3 (custom registry),
	//	4 (Gitlab registry),
	//	5 (ProGet registry),
	//	6 (DockerHub)
	//	7 (ECR)
	//	8 (Github registry)
	Type portainer.RegistryType `example:"6" validate:"required" enums:"1,2,3,4,5,6,7,8"`
	// URL or IP address of the Docker registry
	URL string `example:"registry-1.docker.io" validate:"required"`
	// Username used to authenticate against this registry
	Username string `example:"registry_user"`
	// Password used to authenticate against this registry
	Password string `example:"registry_password"`
	// Use TLS
	TLS bool `example:"true"`
}

type registryPingResponse struct {
	// Success indicates if the registry connection was successful
	Success bool `json:"success" example:"true"`
	// Message provides details about the connection test result
	Message string `json:"message" example:"Registry connection successful"`
}

func (payload *registryPingPayload) Validate(_ *http.Request) error {
	if len(payload.Username) == 0 || len(payload.Password) == 0 {
		return httperror.BadRequest("Username and password are required", nil)
	}

	switch payload.Type {
	case portainer.QuayRegistry, portainer.AzureRegistry, portainer.CustomRegistry, portainer.GitlabRegistry, portainer.ProGetRegistry, portainer.DockerHubRegistry, portainer.EcrRegistry, portainer.GithubRegistry:
	default:
		return httperror.BadRequest("Invalid registry type. Valid values are: 1 (Quay.io), 2 (Azure container registry), 3 (custom registry), 4 (Gitlab registry), 5 (ProGet registry), 6 (DockerHub), 7 (ECR), 8 (Github registry)", nil)
	}

	return nil
}

// @id RegistryPing
// @summary Test registry connection
// @description Test connection to a registry with provided credentials
// @description **Access policy**: authenticated
// @tags registries
// @security ApiKeyAuth
// @security jwt
// @accept json
// @produce json
// @param body body registryPingPayload true "Registry credentials to test"
// @success 200 {object} registryPingResponse "Success"
// @failure 400 "Invalid request"
// @failure 500 "Server error"
// @router /registries/ping [post]
func (handler *Handler) pingRegistry(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload registryPingPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	// Create a temporary registry configuration for testing
	tempRegistry := &portainer.Registry{
		Type:           payload.Type,
		URL:            payload.URL,
		Authentication: true,
		Username:       payload.Username,
		Password:       payload.Password,
	}

	// For DockerHub, ensure URL is set correctly
	if payload.Type == portainer.DockerHubRegistry && payload.URL == "" {
		tempRegistry.URL = "registry-1.docker.io"
	}

	// Set up TLS configuration
	if payload.Type == portainer.CustomRegistry {
		tempRegistry.ManagementConfiguration = &portainer.RegistryManagementConfiguration{
			Type: payload.Type,
			TLSConfig: portainer.TLSConfiguration{
				TLS: payload.TLS || fips.FIPSMode(),
			},
		}
	}

	// Test the registry connection
	success, message := handler.testRegistryConnection(tempRegistry)

	responseData := registryPingResponse{
		Success: success,
		Message: message,
	}

	return response.JSON(w, responseData)
}

// testRegistryConnection tests if we can connect to the registry
func (handler *Handler) testRegistryConnection(registry *portainer.Registry) (bool, string) {
	registryClient, err := liboras.CreateClient(*registry)
	if err != nil {
		log.Error().Err(err).Str("registryURL", registry.URL).Msg("Failed to create registry client")
		return false, "Connection error: Failed to create registry client - " + err.Error()
	}

	ctx := context.Background()
	err = registryClient.Ping(ctx)
	if err != nil {
		errorMessage := categorizeRegistryError(err, registry.URL)
		return false, errorMessage
	}

	log.Debug().Str("registryURL", registry.URL).Msg("Registry ping successful")
	return true, "Registry connection successful"
}

// categorizeRegistryError analyzes the error and returns a user-friendly message
// that distinguishes between connection errors and authentication errors
func categorizeRegistryError(err error, registryURL string) string {
	if err == nil {
		return ""
	}

	var userMessage string

	var errResp *errcode.ErrorResponse
	if errors.As(err, &errResp) {

		// 401 Unauthorized or 403 Forbidden = authentication/authorization issue
		if errResp.StatusCode == http.StatusUnauthorized || errResp.StatusCode == http.StatusForbidden {
			userMessage = "Access token invalid: Authentication failed - please verify your username and access token"
		} else {
			userMessage = "Connection error: " + err.Error()
		}

		logEvent := log.Error().
			Err(err).
			Str("registryURL", registryURL).
			Int("statusCode", errResp.StatusCode).
			Str("userMessage", userMessage)

		if len(errResp.Errors) > 0 {
			logEvent.Interface("errors", errResp.Errors)
		}

		logEvent.Msg("Registry ping failed")

		return userMessage
	}

	// Default: treat everything else as connection error
	userMessage = "Connection error: " + err.Error()

	log.Error().
		Err(err).
		Str("registryURL", registryURL).
		Str("userMessage", userMessage).
		Msg("Registry ping failed")

	return userMessage
}
