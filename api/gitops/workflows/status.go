package workflows

import portainer "github.com/portainer/portainer/api"

func deriveStackTargetState(s portainer.Stack) WorkflowPhaseStatus {
	if len(s.DeploymentStatus) == 0 {
		return WorkflowPhaseStatus{Status: StatusHealthy}
	}
	last := s.DeploymentStatus[len(s.DeploymentStatus)-1]
	switch last.Status {
	case portainer.StackStatusActive:
		return WorkflowPhaseStatus{Status: StatusHealthy}
	case portainer.StackStatusError:
		return WorkflowPhaseStatus{Status: StatusError, Error: last.Message}
	case portainer.StackStatusDeploying:
		return WorkflowPhaseStatus{Status: StatusSyncing}
	case portainer.StackStatusInactive:
		return WorkflowPhaseStatus{Status: StatusPaused}
	default:
		return WorkflowPhaseStatus{Status: StatusUnknown}
	}
}

func deriveEdgeStackTargetState(statuses []portainer.EdgeStackStatusForEnv) WorkflowPhaseStatus {
	result := StatusUnknown
	for _, epStatus := range statuses {
		ws, msg := endpointWorkflowStatus(epStatus)
		if ws == StatusError {
			return WorkflowPhaseStatus{Status: ws, Error: msg}
		}
		if statusPriority(ws) > statusPriority(result) {
			result = ws
		}
	}
	return WorkflowPhaseStatus{Status: result}
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

// EffectiveStatus returns the highest-priority status across all three phases of a workflow.
func EffectiveStatus(w Workflow) Status {
	s := w.Status.Target.Status
	if statusPriority(w.Status.Source.Status) > statusPriority(s) {
		s = w.Status.Source.Status
	}
	if statusPriority(w.Status.Artifact.Status) > statusPriority(s) {
		s = w.Status.Artifact.Status
	}
	return s
}

// CountByStatus counts workflows per effective status and returns a StatusSummary.
func CountByStatus(workflows []Workflow) StatusSummary {
	var s StatusSummary
	for _, w := range workflows {
		switch EffectiveStatus(w) {
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
