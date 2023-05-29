package edgestacks

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperrors "github.com/portainer/portainer/api/http/errors"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/pkg/featureflags"
)

func (handler *Handler) edgeStackCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	method, err := request.RetrieveRouteVariableValue(r, "method")
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: method", err)
	}
	dryrun, _ := request.RetrieveBooleanQueryParameter(r, "dryrun", true)

	tokenData, err := security.RetrieveTokenData(r)
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve user details from authentication token", err)
	}

	var edgeStack *portainer.EdgeStack
	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		edgeStack, err = handler.createSwarmStack(handler.DataStore, method, dryrun, tokenData.ID, r)
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			edgeStack, err = handler.createSwarmStack(tx, method, dryrun, tokenData.ID, r)
			return err
		})
	}
	if err != nil {
		switch {
		case httperrors.IsInvalidPayloadError(err):
			return httperror.BadRequest("Invalid payload", err)
		case httperrors.IsConflictError(err):
			return httperror.NewError(http.StatusConflict, err.Error(), err)
		default:
			return httperror.InternalServerError("Unable to create Edge stack", err)
		}
	}

	return response.JSON(w, edgeStack)
}

func (handler *Handler) createSwarmStack(tx dataservices.DataStoreTx, method string, dryrun bool, userID portainer.UserID, r *http.Request) (*portainer.EdgeStack, error) {
	switch method {
	case "string":
		return handler.createEdgeStackFromFileContent(r, tx, dryrun)
	case "repository":
		return handler.createEdgeStackFromGitRepository(r, tx, dryrun, userID)
	case "file":
		return handler.createEdgeStackFromFileUpload(r, tx, dryrun)
	}

	return nil, httperrors.NewInvalidPayloadError("Invalid value for query parameter: method. Value must be one of: string, repository or file")
}
