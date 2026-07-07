package sources

import portainer "github.com/portainer/portainer/api"

// Status is the string representation of portainer.Status used in API responses.
type Status string

const (
	SourceStatusUnknown Status = "unknown"
	SourceStatusHealthy Status = "healthy"
	SourceStatusError   Status = "error"
)

func StatusString(s portainer.SourceStatus) Status {
	switch s {
	case portainer.SourceStatusHealthy:
		return SourceStatusHealthy
	case portainer.SourceStatusError:
		return SourceStatusError
	default:
		return SourceStatusUnknown
	}
}
