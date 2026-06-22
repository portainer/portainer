package sources

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
)

// gitSourceStore is the minimal intersection of CE and EE DataStoreTx that these functions need.
// Both EE and CE DataStoreTx satisfy it, even though they are incompatible as full interface types.
type gitSourceStore interface {
	Source() dataservices.SourceService
	IsErrObjectNotFound(err error) bool
}

// ValidateGitSourceAccess checks that the given Source exists and is a git Source, and returns it.
func ValidateGitSourceAccess(tx gitSourceStore, userContext *dataservices.SourceServiceUserContext, sourceID portainer.SourceID) (*portainer.Source, *httperror.HandlerError) {
	src, err := tx.Source().Read(userContext, sourceID)
	if err != nil {
		if tx.IsErrObjectNotFound(err) {
			return nil, httperror.NotFound("Source not found", err)
		}
		return nil, httperror.InternalServerError("Unable to read source", err)
	}

	if src.Type != portainer.SourceTypeGit {
		return nil, httperror.BadRequest(fmt.Sprintf("source %d is not a git source", sourceID), nil)
	}

	if src.Git == nil {
		return nil, httperror.BadRequest("Source has no git configuration", nil)
	}

	return src, nil
}
