package workflows

import portainer "github.com/portainer/portainer/api"

func deriveStackStatus(s portainer.Stack) (Status, string) {
	if len(s.DeploymentStatus) == 0 {
		return StatusHealthy, ""
	}
	last := s.DeploymentStatus[len(s.DeploymentStatus)-1]
	switch last.Status {
	case portainer.StackStatusActive:
		return StatusHealthy, ""
	case portainer.StackStatusError:
		return StatusError, last.Message
	case portainer.StackStatusDeploying:
		return StatusSyncing, ""
	case portainer.StackStatusInactive:
		return StatusPaused, ""
	default:
		return StatusUnknown, ""
	}
}

func deriveEdgeStackStatus(statuses []portainer.EdgeStackStatusForEnv) (Status, string) {
	result := StatusUnknown
	for _, epStatus := range statuses {
		ws, msg := endpointWorkflowStatus(epStatus)
		if ws == StatusError {
			return ws, msg
		}
		if statusPriority(ws) > statusPriority(result) {
			result = ws
		}
	}
	return result, ""
}

func endpointWorkflowStatus(epStatus portainer.EdgeStackStatusForEnv) (Status, string) {
	if len(epStatus.Status) == 0 {
		return StatusUnknown, ""
	}
	last := epStatus.Status[len(epStatus.Status)-1]
	switch last.Type {
	case portainer.EdgeStackStatusError:
		return StatusError, last.Error
	case portainer.EdgeStackStatusDeploying,
		portainer.EdgeStackStatusRollingBack,
		portainer.EdgeStackStatusRemoving,
		portainer.EdgeStackStatusPending,
		portainer.EdgeStackStatusDeploymentReceived,
		portainer.EdgeStackStatusAcknowledged,
		portainer.EdgeStackStatusImagesPulled:
		return StatusSyncing, ""
	case portainer.EdgeStackStatusPausedDeploying:
		return StatusPaused, ""
	case portainer.EdgeStackStatusRunning,
		portainer.EdgeStackStatusRolledBack,
		portainer.EdgeStackStatusCompleted,
		portainer.EdgeStackStatusRemoved,
		portainer.EdgeStackStatusRemoteUpdateSuccess:
		return StatusHealthy, ""
	default:
		return StatusUnknown, ""
	}
}

// CountByStatus counts workflows per status and returns a StatusSummary.
func CountByStatus(workflows []Workflow) StatusSummary {
	var s StatusSummary
	for _, w := range workflows {
		switch w.Status {
		case StatusHealthy:
			s.Healthy++
		case StatusSyncing:
			s.Syncing++
		case StatusError:
			s.Error++
		case StatusPaused:
			s.Paused++
		default:
			s.Unknown++
		}
	}
	return s
}

func statusPriority(s Status) int {
	switch s {
	case StatusError:
		return 4
	case StatusSyncing:
		return 3
	case StatusPaused:
		return 2
	case StatusHealthy:
		return 1
	default:
		return 0
	}
}
