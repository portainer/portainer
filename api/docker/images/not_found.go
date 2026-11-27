package images

import (
	"errors"
	"net/http"
	"slices"
	"strings"

	"go.podman.io/image/v5/docker"
)

// A 404 to the manifest HEAD request appears in a RemoteDigest error as both of these. A HEAD response has no
// body, so the library reports it through an unexported error type that only exposes the status in its
// message. The manifest request is named, because a 404 to the registry's /v2/ ping has the same status text
// and means the registry can't be used, not that the image is missing.
const (
	manifestRequestMessage = "reading digest "
	headNotFoundMessage    = "StatusCode: 404,"
)

// IsImageNotFound reports whether a RemoteDigest error means the registry has no such image, as opposed to
// the registry being unreachable or refusing the credentials
func IsImageNotFound(err error) bool {
	if err == nil {
		return false
	}

	if statusErr, ok := errors.AsType[docker.UnexpectedHTTPStatusError](err); ok {
		return statusErr.StatusCode == http.StatusNotFound
	}

	message := err.Error()

	return strings.Contains(message, manifestRequestMessage) && strings.Contains(message, headNotFoundMessage)
}

// accessDeniedMessages are how a registry refusing the manifest request appears in a RemoteDigest error: a 401
// without a body, or the registry's DENIED or UNAUTHORIZED error. Docker Hub answers this way for a repository
// that doesn't exist, as well as for one the credentials can't pull.
var accessDeniedMessages = []string{
	"StatusCode: 401,",
	"requested access to the resource is denied",
	"authentication required",
}

// IsImageAccessDenied reports whether a RemoteDigest error means the registry refused to serve the image: it
// doesn't exist, or the credentials used can't pull it
func IsImageAccessDenied(err error) bool {
	if err == nil {
		return false
	}

	if _, ok := errors.AsType[docker.ErrUnauthorizedForCredentials](err); ok {
		return true
	}

	message := err.Error()
	if !strings.Contains(message, manifestRequestMessage) {
		return false
	}

	return slices.ContainsFunc(accessDeniedMessages, func(denied string) bool {
		return strings.Contains(message, denied)
	})
}
