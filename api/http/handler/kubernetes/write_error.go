package kubernetes

import (
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// writeErrorResponse maps an error returned by a Kubernetes write operation to the
// matching HTTP response and logs it against the resource it applied to. action names
// the operation that failed, phrased to read after "unable to", e.g. "create the secret".
func writeErrorResponse(err error, logContext, namespace, resourceName, action string) *httperror.HandlerError {
	event := log.Error().Err(err).Str("context", logContext).Str("namespace", namespace).Str("resource", resourceName)

	switch {
	case k8serrors.IsUnauthorized(err) || k8serrors.IsForbidden(err):
		event.Msg("Unauthorized access to the Kubernetes API")
		return httperror.Forbidden("unauthorized access to the Kubernetes API. Error: ", err)

	case k8serrors.IsAlreadyExists(err):
		event.Msg("Unable to " + action + ", it already exists")
		return httperror.Conflict("unable to "+action+", it already exists. Error: ", err)

	case k8serrors.IsConflict(err):
		event.Msg("Unable to " + action + ", it was modified concurrently")
		return httperror.Conflict("unable to "+action+", it was modified concurrently. Error: ", err)

	case k8serrors.IsNotFound(err):
		event.Msg("Unable to " + action + ", it does not exist")
		return httperror.NotFound("unable to "+action+", it does not exist. Error: ", err)

	case k8serrors.IsInvalid(err):
		event.Msg("Unable to " + action + ", the Kubernetes API rejected it as invalid")
		return httperror.BadRequest("unable to "+action+", the Kubernetes API rejected it as invalid. Error: ", err)
	}

	event.Msg("Unable to " + action)
	return httperror.InternalServerError("unable to "+action+". Error: ", err)
}
