package edgestacks

import (
	"errors"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/gitops/workflows"
	"github.com/portainer/portainer/api/http/security"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/rs/zerolog/log"
)

// GitSyncSourceError wraps a failed git operation together with the source it must be recorded
// against. The transaction observing the failure returns a non-nil error and gets rolled back,
// so the source status can't be persisted as part of it: the caller persists it separately,
// once the rollback has already happened.
type GitSyncSourceError struct {
	SourceID portainer.SourceID
	Cause    error
	httpErr  *httperror.HandlerError
}

func (e *GitSyncSourceError) Error() string { return e.httpErr.Error() }
func (e *GitSyncSourceError) Unwrap() error { return e.httpErr }

// NewGitSyncSourceError builds a GitSyncSourceError, pre-rendering the HTTP response from msg and
// cause so persistGitSyncFailure can persist the source status after rollback without
// re-deriving it.
func NewGitSyncSourceError(sourceID portainer.SourceID, msg string, cause error) *GitSyncSourceError {
	return &GitSyncSourceError{SourceID: sourceID, Cause: cause, httpErr: httperror.InternalServerError(msg, cause)}
}

// GitSyncWorkflowError wraps a failed git operation scoped to a specific workflow's edge stack
// artifact, together with the identifiers needed to record it once the transaction observing the
// failure has already been rolled back.
type GitSyncWorkflowError struct {
	WorkflowID  portainer.WorkflowID
	EdgeStackID portainer.EdgeStackID
	SourceID    portainer.SourceID
	Cause       error
	httpErr     *httperror.HandlerError
}

func (e *GitSyncWorkflowError) Error() string { return e.httpErr.Error() }
func (e *GitSyncWorkflowError) Unwrap() error { return e.httpErr }

// NewGitSyncWorkflowError builds a GitSyncWorkflowError, pre-rendering the HTTP response from msg
// and cause so persistGitSyncFailure can persist the edge stack's artifact status after rollback
// without re-deriving it.
func NewGitSyncWorkflowError(workflowID portainer.WorkflowID, edgeStackID portainer.EdgeStackID, sourceID portainer.SourceID, msg string, cause error) *GitSyncWorkflowError {
	return &GitSyncWorkflowError{WorkflowID: workflowID, EdgeStackID: edgeStackID, SourceID: sourceID, Cause: cause, httpErr: httperror.InternalServerError(msg, cause)}
}

// persistGitSyncFailure records a failed git operation in a follow-up transaction, after the
// transaction that observed the failure has already been rolled back. Workflow-scoped failures
// update the edge stack's artifact status; other failures update only the source's sync status.
func (handler *Handler) persistGitSyncFailure(securityContext *security.RestrictedRequestContext, err error) {
	userContext := source.NewUserContext(securityContext.User, securityContext.UserMemberships)

	if workflowErr, ok := errors.AsType[*GitSyncWorkflowError](err); ok {
		handler.persistWorkflowGitSyncFailure(userContext, workflowErr)
		return
	}

	if sourceErr, ok := errors.AsType[*GitSyncSourceError](err); ok {
		handler.persistSourceGitSyncFailure(userContext, sourceErr)
	}
}

func (handler *Handler) persistWorkflowGitSyncFailure(userContext source.UserContext, syncErr *GitSyncWorkflowError) {
	if persistErr := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return workflows.SaveEdgeStackStatus(tx, userContext, syncErr.WorkflowID, syncErr.EdgeStackID, syncErr.SourceID, syncErr.Cause)
	}); persistErr != nil {
		log.Warn().Str("context", "GitSyncFailure").Err(persistErr).Msg("Failed to persist git sync status after a failed edge stack operation")
	}
}

func (handler *Handler) persistSourceGitSyncFailure(userContext source.UserContext, syncErr *GitSyncSourceError) {
	if persistErr := handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return workflows.SaveSourceStatus(tx, userContext, syncErr.SourceID, syncErr.Cause)
	}); persistErr != nil {
		log.Warn().Str("context", "GitSyncFailure").Err(persistErr).Msg("Failed to persist git sync status after a failed edge stack operation")
	}
}
