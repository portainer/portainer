package cli

import "errors"

// ErrUnauthorized is returned when a non-admin user attempts to access a resource
// outside their permitted namespace scope.
var ErrUnauthorized = errors.New("unauthorized")

// ErrNoRolloutHistory is returned when a deployment has no earlier revision to roll
// back to.
var ErrNoRolloutHistory = errors.New("the deployment has no previous revision to roll back to")

// ErrRevisionNotFound is returned when the requested revision is not part of a
// deployment's rollout history.
var ErrRevisionNotFound = errors.New("revision not found in the deployment rollout history")
