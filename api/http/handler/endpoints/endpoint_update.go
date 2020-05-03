package endpoints

import (
	"net/http"
	"reflect"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/http/client"
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
}

func (payload *endpointUpdatePayload) Validate(r *http.Request) error {
	return nil
}

// PUT request on /api/endpoints/:id
func (handler *Handler) endpointUpdate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	if !handler.authorizeEndpointManagement {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Endpoint management is disabled", ErrEndpointManagementDisabled}
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

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	if payload.Name != nil {
		endpoint.Name = *payload.Name
	}

	if payload.URL != nil {
		endpoint.URL = *payload.URL
	}

	if payload.PublicURL != nil {
		endpoint.PublicURL = *payload.PublicURL
	}

	groupIDChanged := false
	if payload.GroupID != nil {
		groupID := portainer.EndpointGroupID(*payload.GroupID)
		groupIDChanged = groupID != endpoint.GroupID
		endpoint.GroupID = groupID
	}

	tagsChanged := false
	if payload.TagIDs != nil {
		payloadTagSet := portainer.TagSet(payload.TagIDs)
		endpointTagSet := portainer.TagSet((endpoint.TagIDs))
		union := portainer.TagUnion(payloadTagSet, endpointTagSet)
		intersection := portainer.TagIntersection(payloadTagSet, endpointTagSet)
		tagsChanged = len(union) > len(intersection)

		if tagsChanged {
			removeTags := portainer.TagDifference(endpointTagSet, payloadTagSet)

			for tagID := range removeTags {
				tag, err := handler.TagService.Tag(tagID)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a tag inside the database", err}
				}

				delete(tag.Endpoints, endpoint.ID)
				err = handler.TagService.UpdateTag(tag.ID, tag)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag changes inside the database", err}
				}
			}

			endpoint.TagIDs = payload.TagIDs
			for _, tagID := range payload.TagIDs {
				tag, err := handler.TagService.Tag(tagID)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find a tag inside the database", err}
				}

				tag.Endpoints[endpoint.ID] = true

				err = handler.TagService.UpdateTag(tag.ID, tag)
				if err != nil {
					return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist tag changes inside the database", err}
				}
			}
		}
	}

	updateAuthorizations := false
	if payload.UserAccessPolicies != nil && !reflect.DeepEqual(payload.UserAccessPolicies, endpoint.UserAccessPolicies) {
		endpoint.UserAccessPolicies = payload.UserAccessPolicies
		updateAuthorizations = true
	}

	if payload.TeamAccessPolicies != nil && !reflect.DeepEqual(payload.TeamAccessPolicies, endpoint.TeamAccessPolicies) {
		endpoint.TeamAccessPolicies = payload.TeamAccessPolicies
		updateAuthorizations = true
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

	err = handler.EndpointService.UpdateEndpoint(endpoint.ID, endpoint)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint changes inside the database", err}
	}

	if updateAuthorizations {
		err = handler.AuthorizationService.UpdateUsersAuthorizations()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to update user authorizations", err}
		}
	}

	if endpoint.Type == portainer.EdgeAgentEnvironment && (groupIDChanged || tagsChanged) {
		relation, err := handler.EndpointRelationService.EndpointRelation(endpoint.ID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find endpoint relation inside the database", err}
		}

		endpointGroup, err := handler.EndpointGroupService.EndpointGroup(endpoint.GroupID)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find endpoint group inside the database", err}
		}

		edgeGroups, err := handler.EdgeGroupService.EdgeGroups()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge groups from the database", err}
		}

		edgeStacks, err := handler.EdgeStackService.EdgeStacks()
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to retrieve edge stacks from the database", err}
		}

		edgeStackSet := map[portainer.EdgeStackID]bool{}

		endpointEdgeStacks := portainer.EndpointRelatedEdgeStacks(endpoint, endpointGroup, edgeGroups, edgeStacks)
		for _, edgeStackID := range endpointEdgeStacks {
			edgeStackSet[edgeStackID] = true
		}

		relation.EdgeStacks = edgeStackSet

		err = handler.EndpointRelationService.UpdateEndpointRelation(endpoint.ID, relation)
		if err != nil {
			return &httperror.HandlerError{http.StatusInternalServerError, "Unable to persist endpoint relation changes inside the database", err}
		}
	}

	return response.JSON(w, endpoint)
}
