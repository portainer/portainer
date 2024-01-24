package endpoints

import (
	"net/http"
	"reflect"
	"strconv"
	"strings"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/http/client"
)

type endpointUpdatePayload struct {
	// Name that will be used to identify this environment(endpoint)
	Name *string `example:"my-environment"`
	// URL or IP address of a Docker host
	URL *string `example:"docker.mydomain.tld:2375"`
	// URL or IP address where exposed containers will be reachable.\
	// Defaults to URL if not specified
	PublicURL *string `example:"docker.mydomain.tld:2375"`
	// GPUs information
	Gpus []portainer.Pair
	// Group identifier
	GroupID *int `example:"1"`
	// Require TLS to connect against this environment(endpoint)
	TLS *bool `example:"true"`
	// Skip server verification when using TLS
	TLSSkipVerify *bool `example:"false"`
	// Skip client verification when using TLS
	TLSSkipClientVerify *bool `example:"false"`
	// The status of the environment(endpoint) (1 - up, 2 - down)
	Status *int `example:"1"`
	// Azure application ID
	AzureApplicationID *string `example:"eag7cdo9-o09l-9i83-9dO9-f0b23oe78db4"`
	// Azure tenant ID
	AzureTenantID *string `example:"34ddc78d-4fel-2358-8cc1-df84c8o839f5"`
	// Azure authentication key
	AzureAuthenticationKey *string `example:"cOrXoK/1D35w8YQ8nH1/8ZGwzz45JIYD5jxHKXEQknk="`
	// List of tag identifiers to which this environment(endpoint) is associated
	TagIDs             []portainer.TagID `example:"1,2"`
	UserAccessPolicies portainer.UserAccessPolicies
	TeamAccessPolicies portainer.TeamAccessPolicies
	// The check in interval for edge agent (in seconds)
	EdgeCheckinInterval *int `example:"5"`
	// Associated Kubernetes data
	Kubernetes *portainer.KubernetesData
}

func (payload *endpointUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// @id EndpointUpdate
// @summary Update an environment(endpoint)
// @description Update an environment(endpoint).
// @description **Access policy**: authenticated
// @security ApiKeyAuth
// @security jwt
// @tags endpoints
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param body body endpointUpdatePayload true "Environment(Endpoint) details"
// @success 200 {object} portainer.Endpoint "Success"
// @failure 400 "Invalid request"
// @failure 404 "Environment(Endpoint) not found"
// @failure 500 "Server error"
// @router /endpoints/{id} [put]
func (handler *Handler) endpointUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return httperror.BadRequest("Invalid environment identifier route variable", err)
	}

	var payload endpointUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if handler.DataStore.IsErrObjectNotFound(err) {
		return httperror.NotFound("Unable to find an environment with the specified identifier inside the database", err)
	} else if err != nil {
		return httperror.InternalServerError("Unable to find an environment with the specified identifier inside the database", err)
	}

	if payload.Name != nil {
		name := *payload.Name
		isUnique, err := handler.isNameUnique(name, endpoint.ID)
		if err != nil {
			return httperror.InternalServerError("Unable to check if name is unique", err)
		}

		if !isUnique {
			return httperror.NewError(http.StatusConflict, "Name is not unique", nil)
		}

		endpoint.Name = name

	}

	if payload.URL != nil {
		endpoint.URL = *payload.URL
	}

	if payload.PublicURL != nil {
		endpoint.PublicURL = *payload.PublicURL
	}

	if payload.Gpus != nil {
		endpoint.Gpus = payload.Gpus
	}

	if payload.EdgeCheckinInterval != nil {
		endpoint.EdgeCheckinInterval = *payload.EdgeCheckinInterval
	}

	updateRelations := false

	if payload.GroupID != nil {
		groupID := portainer.EndpointGroupID(*payload.GroupID)

		endpoint.GroupID = groupID
		updateRelations = updateRelations || groupID != endpoint.GroupID
	}

	if payload.TagIDs != nil {
		err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {

			tagsChanged, err := updateEnvironmentTags(tx, payload.TagIDs, endpoint.TagIDs, endpoint.ID)
			if err != nil {
				return err
			}

			endpoint.TagIDs = payload.TagIDs
			updateRelations = updateRelations || tagsChanged

			return nil
		})

		if err != nil {
			httperror.InternalServerError("Unable to update environment tags", err)
		}
	}

	updateAuthorizations := false

	if payload.Kubernetes != nil {
		if payload.Kubernetes.Configuration.RestrictDefaultNamespace !=
			endpoint.Kubernetes.Configuration.RestrictDefaultNamespace {
			updateAuthorizations = true
		}

		endpoint.Kubernetes = *payload.Kubernetes
	}

	if payload.UserAccessPolicies != nil && !reflect.DeepEqual(payload.UserAccessPolicies, endpoint.UserAccessPolicies) {
		updateAuthorizations = true
		endpoint.UserAccessPolicies = payload.UserAccessPolicies
	}

	if payload.TeamAccessPolicies != nil && !reflect.DeepEqual(payload.TeamAccessPolicies, endpoint.TeamAccessPolicies) {
		updateAuthorizations = true
		endpoint.TeamAccessPolicies = payload.TeamAccessPolicies
	}

	if payload.Status != nil {
		switch *payload.Status {
		case 1:
			endpoint.Status = portainer.EndpointStatusUp
		case 2:
			endpoint.Status = portainer.EndpointStatusDown
		}
	}

	if endpoint.Type == portainer.AzureEnvironment {
		credentials := endpoint.AzureCredentials
		if payload.AzureApplicationID != nil {
			credentials.ApplicationID = *payload.AzureApplicationID
		}
		if payload.AzureTenantID != nil {
			credentials.TenantID = *payload.AzureTenantID
		}
		if payload.AzureAuthenticationKey != nil {
			credentials.AuthenticationKey = *payload.AzureAuthenticationKey
		}

		httpClient := client.NewHTTPClient()
		_, authErr := httpClient.ExecuteAzureAuthenticationRequest(&credentials)
		if authErr != nil {
			return httperror.InternalServerError("Unable to authenticate against Azure", authErr)
		}
		endpoint.AzureCredentials = credentials
	}

	if payload.TLS != nil {
		folder := strconv.Itoa(endpointID)

		if *payload.TLS {
			endpoint.TLSConfig.TLS = true
			if payload.TLSSkipVerify != nil {
				endpoint.TLSConfig.TLSSkipVerify = *payload.TLSSkipVerify

				if !*payload.TLSSkipVerify {
					caCertPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileCA)
					endpoint.TLSConfig.TLSCACertPath = caCertPath
				} else {
					endpoint.TLSConfig.TLSCACertPath = ""
					handler.FileService.DeleteTLSFile(folder, portainer.TLSFileCA)
				}
			}

			if payload.TLSSkipClientVerify != nil {
				if !*payload.TLSSkipClientVerify {
					certPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileCert)
					endpoint.TLSConfig.TLSCertPath = certPath
					keyPath, _ := handler.FileService.GetPathForTLSFile(folder, portainer.TLSFileKey)
					endpoint.TLSConfig.TLSKeyPath = keyPath
				} else {
					endpoint.TLSConfig.TLSCertPath = ""
					handler.FileService.DeleteTLSFile(folder, portainer.TLSFileCert)
					endpoint.TLSConfig.TLSKeyPath = ""
					handler.FileService.DeleteTLSFile(folder, portainer.TLSFileKey)
				}
			}

		} else {
			endpoint.TLSConfig.TLS = false
			endpoint.TLSConfig.TLSSkipVerify = false
			endpoint.TLSConfig.TLSCACertPath = ""
			endpoint.TLSConfig.TLSCertPath = ""
			endpoint.TLSConfig.TLSKeyPath = ""
			err = handler.FileService.DeleteTLSFiles(folder)
			if err != nil {
				return httperror.InternalServerError("Unable to remove TLS files from disk", err)
			}
		}

		if endpoint.Type == portainer.AgentOnKubernetesEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment {
			endpoint.TLSConfig.TLS = true
			endpoint.TLSConfig.TLSSkipVerify = true
		}
	}

	if (payload.URL != nil && *payload.URL != endpoint.URL) ||
		(payload.TLS != nil && endpoint.TLSConfig.TLS != *payload.TLS) ||
		endpoint.Type == portainer.AzureEnvironment ||
		shouldReloadTLSConfiguration(endpoint, &payload) {
		handler.ProxyManager.DeleteEndpointProxy(endpoint.ID)
		_, err = handler.ProxyManager.CreateAndRegisterEndpointProxy(endpoint)
		if err != nil {
			return httperror.InternalServerError("Unable to register HTTP proxy for the environment", err)
		}
	}

	if updateAuthorizations {
		if endpoint.Type == portainer.KubernetesLocalEnvironment || endpoint.Type == portainer.AgentOnKubernetesEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment {
			err = handler.AuthorizationService.CleanNAPWithOverridePolicies(handler.DataStore, endpoint, nil)
			if err != nil {
				return httperror.InternalServerError("Unable to update user authorizations", err)
			}
		}
	}

	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to persist environment changes inside the database", err)
	}

	if updateRelations {
		err := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			return handler.updateEdgeRelations(tx, endpoint)
		})

		if err != nil {
			return httperror.InternalServerError("Unable to update environment relations", err)
		}
	}

	err = handler.SnapshotService.FillSnapshotData(endpoint)
	if err != nil {
		return httperror.InternalServerError("Unable to add snapshot data", err)
	}

	return response.JSON(w, endpoint)
}

func shouldReloadTLSConfiguration(endpoint *portainer.Endpoint, payload *endpointUpdatePayload) bool {
	// When updating Docker API environment, as long as TLS is true and TLSSkipVerify is false,
	// we assume that new TLS files have been uploaded and we need to reload the TLS configuration.
	if endpoint.Type != portainer.DockerEnvironment ||
		(payload.URL != nil && !strings.HasPrefix(*payload.URL, "tcp://")) ||
		payload.TLS == nil || !*payload.TLS {
		return false
	}

	if payload.TLSSkipVerify != nil && !*payload.TLSSkipVerify {
		return true
	}

	if payload.TLSSkipClientVerify != nil && !*payload.TLSSkipClientVerify {
		return true
	}
	return false
}
