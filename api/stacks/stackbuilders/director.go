package stackbuilders

import (
	"context"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/rs/zerolog/log"
)

// stackBuildProcess is the common interface shared by all stack build methods.
type stackBuildProcess interface {
	setGeneralInfo(payload *StackPayload, endpoint *portainer.Endpoint)
	// prepare handles all pre-save steps: sets type-specific metadata, stores
	// files on disk, or clones the git repository.
	prepare(ctx context.Context, payload *StackPayload, userID portainer.UserID) error
	saveStack() (*portainer.Stack, error)
	deploy(ctx context.Context, endpoint *portainer.Endpoint) error
	// postDeploy runs after a successful deployment: for git builders it enables
	// auto-update; for other builders it is a no-op.
	postDeploy(ctx context.Context, stack *portainer.Stack) error
}

// Build executes the stack build process. It returns the created stack and any
// error encountered during the process. The returned error is of type
// *httperror.HandlerError, which could be an InternalServerError depending on
// the error encountered during the stack build process.
//
// The stack is saved to DB with Status=Deploying and returned immediately.
// Deployment runs in a background goroutine. The caller must poll
// GET /stacks/{id} to track completion.
func Build(ctx context.Context, dataStore dataservices.DataStore, builder stackBuildProcess, payload *StackPayload, endpoint *portainer.Endpoint, userID portainer.UserID) (*portainer.Stack, *httperror.HandlerError) {
	builder.setGeneralInfo(payload, endpoint)

	if err := builder.prepare(ctx, payload, userID); err != nil {
		return nil, httperror.InternalServerError("Failed to prepare stack", err)
	}

	stack, err := builder.saveStack()
	if err != nil {
		return nil, httperror.InternalServerError("Failed to save stack", err)
	}

	go deploy(dataStore, builder, stack.ID, endpoint)

	return stack, nil
}

func deploy(dataStore dataservices.DataStore, builder stackBuildProcess, stackID portainer.StackID, endpoint *portainer.Endpoint) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()

	deployErr := builder.deploy(ctx, endpoint)

	var stack *portainer.Stack

	if err := dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		var err error

		stack, err = tx.Stack().Read(stackID)
		if err != nil {
			return err
		}

		stackutils.UpdateStackStatusFromDeploymentResult(stack, deployErr)

		return tx.Stack().Update(stack.ID, stack)
	}); err != nil {
		log.Error().Err(err).
			AnErr("deploy_error", deployErr).
			Int("stack_id", int(stackID)).
			Str("context", "deploy").
			Msg("Failed to update stack status after async deployment")

		return
	}

	if deployErr != nil {
		return
	}

	if err := builder.postDeploy(ctx, stack); err != nil {
		log.Error().Err(err).
			Int("stack_id", int(stackID)).
			Str("context", "deploy").
			Msg("Failed to run post-deployment hook")
	}
}
