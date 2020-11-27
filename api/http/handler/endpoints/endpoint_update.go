package endpoints

import (
	"errors"
	"net/http"
	"reflect"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	bolterrors "github.com/portainer/portainer/api/bolt/errors"
	"github.com/portainer/portainer/api/http/client"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/tag"
)

type endpointUpdatePayload struct {
	Name                   *string
	URL                    *string
	PublicURL              *string
	GroupID                *int
	TLS                    *bool
	TLSSkipVerify          *bool
	TLSSkipClientVerify    *bool
	Status                 *int
	AzureApplicationID     *string
	AzureTenantID          *string
	AzureAuthenticationKey *string
	TagIDs                 []portainer.TagID
	UserAccessPolicies     portainer.UserAccessPolicies
	TeamAccessPolicies     portainer.TeamAccessPolicies
	EdgeCheckinInterval    *int
	Kubernetes             *portainer.KubernetesData
}

func (payload *endpointUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/endpoints/:id
func (handler *Handler) endpointUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	// make sure user has been issued a token
	permissionDeniedErr := "Permission denied to update endpoint"
	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
	}

	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	var payload endpointUpdatePayload
	err = request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	endpoint, err := handler.DataStore.Endpoint().Endpoint(portainer.EndpointID(endpointID))
	if err == bolterrors.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	isAdmin := tokenData.Role == portainer.AdministratorRole
	canK8sClusterSetup := isAdmin || false
	// if user is not a portainer admin, we might allow update k8s cluster config
	if !isAdmin {
		// check if the user can access cluster setup in the endpoint (endpoint admin)
		endpointRole, err := handler.AuthorizationService.GetUserEndpointRole(int(tokenData.ID), int(endpoint.ID))
		if err != nil {
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		} else if !endpointRole.Authorizations[portainer.OperationK8sClusterSetupRW] {
			err = errors.New(permissionDeniedErr)
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		}
		// deny access if user can not access all namespaces
		if !endpointRole.Authorizations[portainer.OperationK8sAccessAllNamespaces] {
			err = errors.New(permissionDeniedErr)
			return &httperror.HandlerError{http.StatusForbidden, permissionDeniedErr, err}
		} else {
			canK8sClusterSetup = true
		}
	}

	updateAuthorizations := false
	if canK8sClusterSetup && payload.Kubernetes != nil {
		endpoint.Kubernetes = *payload.Kubernetes

		if payload.Kubernetes.Configuration.RestrictDefaultNamespace !=
			endpoint.Kubernetes.Configuration.RestrictDefaultNamespace {
			updateAuthorizations = true
		}
	}

	groupIDChanged := false
	tagsChanged := false
	if isAdmin {
		if payload.Name != nil {
			endpoint.Name = *payload.Name
		}

		if payload.URL != nil {
			endpoint.URL = *payload.URL
		}

		if payload.PublicURL != nil {
			endpoint.PublicURL = *payload.PublicURL
		}

		if payload.EdgeCheckinInterval != nil {
			endpoint.EdgeCheckinInterval = *payload.EdgeCheckinInterval
		}

		if payload.GroupID != nil {
			groupID := portainer.EndpointGroupID(*payload.GroupID)
			groupIDChanged = groupID != endpoint.GroupID
			endpoint.GroupID = groupID
		}

		if payload.TagIDs != nil {
			payloadTagSet := tag.Set(payload.TagIDs)
			endpointTagSet := tag.Set((endpoint.TagIDs))
			union := tag.Union(payloadTagSet, endpointTagSet)
			intersection := tag.Intersection(payloadTagSet, endpointTagSet)
			tagsChanged = len(union) > len(intersection)

			if tagsChanged {
				removeTags := tag.Difference(endpointTagSet, payloadTagSet)

				for tagID := range removeTags {
					tag, err := handler.DataStore.Tag().Tag(tagID)
					if err != nil {
						return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a tag inside the database", err}
					}

					delete(tag.Endpoints, endpoint.ID)
					err = handler.DataStore.Tag().UpdateTag(tag.ID, tag)
					if err != nil {
						return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag changes inside the database", err}
					}
				}

				endpoint.TagIDs = payload.TagIDs
				for _, tagID := range payload.TagIDs {
					tag, err := handler.DataStore.Tag().Tag(tagID)
					if err != nil {
						return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a tag inside the database", err}
					}

					tag.Endpoints[endpoint.ID] = true

					err = handler.DataStore.Tag().UpdateTag(tag.ID, tag)
					if err != nil {
						return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag changes inside the database", err}
					}
				}
			}
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
				break
			case 2:
				endpoint.Status = portainer.EndpointStatusDown
				break
			default:
				break
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
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to authenticate against Azure", authErr}
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
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to remove TLS files from disk", err}
				}
			}
		}

		if payload.URL != nil || payload.TLS != nil || endpoint.Type == portainer.AzureEnvironment {
			_, err = handler.ProxyManager.CreateAndRegisterEndpointProxy(endpoint)
			if err != nil {
				return &httperror.HandlerError{http.StatusInternalServerError, "Unable to register HTTP proxy for the endpoint", err}
			}
		}
	}

	err = handler.DataStore.Endpoint().UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
	}

	if updateAuthorizations {
		err = handler.AuthorizationService.UpdateUsersAuthorizations()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update user authorizations", err}
		}
	}

	if (endpoint.Type == portainer.EdgeAgentOnDockerEnvironment || endpoint.Type == portainer.EdgeAgentOnKubernetesEnvironment) && (groupIDChanged || tagsChanged) {
		relation, err := handler.DataStore.EndpointRelation().EndpointRelation(endpoint.ID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find endpoint relation inside the database", err}
		}

		endpointGroup, err := handler.DataStore.EndpointGroup().EndpointGroup(endpoint.GroupID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find endpoint group inside the database", err}
		}

		edgeGroups, err := handler.DataStore.EdgeGroup().EdgeGroups()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge groups from the database", err}
		}

		edgeStacks, err := handler.DataStore.EdgeStack().EdgeStacks()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge stacks from the database", err}
		}

		edgeStackSet := map[portainer.EdgeStackID]bool{}

		endpointEdgeStacks := edge.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
		for _, edgeStackID := range endpointEdgeStacks {
			edgeStackSet[edgeStackID] = true
		}

		relation.EdgeStacks = edgeStackSet

		err = handler.DataStore.EndpointRelation().UpdateEndpointRelation(endpoint.ID, relation)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint relation changes inside the database", err}
		}
	}

	return response.JSON(w, endpoint)
}
