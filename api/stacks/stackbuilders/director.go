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
	cleanUp() error
	// postDeploy runs after a successful deployment: for git builders it enables
	// auto-update; for other builders it is a no-op.
	postDeploy(ctx context.Context, stack *portainer.Stack) error
}

// BuildAndAsyncDeploy executes the stack build process. It returns the created stack and any
// error encountered during the process. The returned error is of type
// *httperror.HandlerError, which could be an InternalServerError depending on
// the error encountered during the stack build process.
//
// The stack is saved to DB with Status=Deploying and returned immediately.
// Deployment runs in a background goroutine. The caller must poll
// GET /stacks/{id} to track completion.
func BuildAndAsyncDeploy(ctx context.Context, dataStore dataservices.DataStore, builder stackBuildProcess, payload *StackPayload, endpoint *portainer.Endpoint, userID portainer.UserID) (*portainer.Stack, *httperror.HandlerError) {
	builder.setGeneralInfo(payload, endpoint)

	defer func() { _ = builder.cleanUp() }()

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

// BuildAndDeploy is like BuildAndAsyncDeploy, but deploys inline and returns any deploy failure to
// the caller.
//
// The async wrapper hid real failures: an apply that errors before even reaching the cluster
// (e.g. a missing namespace) only recorded its error on the stack, in the background
// (BE-13174). The Applications List reads live from the cluster rather than from stack records, so
// surfacing it there would mean reworking that list's data source - and its delete and other
// actions - to understand stack records too. Deploying inline and returning the error is the
// simpler, safer fix.
//
// Separately, Kubernetes doesn't need Portainer's own async wrapper: kubectl apply returns as soon
// as the API server accepts the manifest, and the cluster reconciles it asynchronously on its own.
// Swarm and Compose deploys can run long (image pulls, etc.), so they keep using
// BuildAndAsyncDeploy.
func BuildAndDeploy(ctx context.Context, dataStore dataservices.DataStore, builder stackBuildProcess, payload *StackPayload, endpoint *portainer.Endpoint, userID portainer.UserID) (*portainer.Stack, *httperror.HandlerError) {
	builder.setGeneralInfo(payload, endpoint)

	defer func() { _ = builder.cleanUp() }()

	if err := builder.prepare(ctx, payload, userID); err != nil {
		return nil, httperror.InternalServerError("Failed to prepare stack", err)
	}

	// Not tied to ctx: canceling on client disconnect could orphan cluster resources with no stack record.
	deployCtx, cancel := context.WithTimeout(context.Background(), stackutils.InlineDeployTimeout)
	defer cancel()

	if err := builder.deploy(deployCtx, endpoint); err != nil {
		return nil, httperror.InternalServerError("Failed to deploy stack", err)
	}

	stack, err := builder.saveStack()
	if err != nil {
		return nil, httperror.InternalServerError("Failed to save stack", err)
	}

	if err := dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		stackutils.UpdateStackStatusFromDeploymentResult(stack, nil)
		return tx.Stack().Update(stack.ID, stack)
	}); err != nil {
		return stack, httperror.InternalServerError("Failed to persist stack deployment status", err)
	}

	if err := builder.postDeploy(ctx, stack); err != nil {
		return stack, httperror.InternalServerError("Failed to run post-deployment hook", err)
	}

	return stack, nil
}

func deploy(dataStore dataservices.DataStore, builder stackBuildProcess, stackID portainer.StackID, endpoint *portainer.Endpoint) {
	backgroundCtx := context.Background()
	ctx, cancel := context.WithTimeout(backgroundCtx, 15*time.Minute)
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

	if err := builder.postDeploy(backgroundCtx, stack); err != nil {
		log.Error().Err(err).
			Int("stack_id", int(stackID)).
			Str("context", "deploy").
			Msg("Failed to run post-deployment hook")
	}
}
