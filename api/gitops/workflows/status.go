package workflows

import portainer "github.com/portainer/portainer/api"

func SourceStatusToPhase(s portainer.SourceStatus, errMsg string) WorkflowPhaseStatus {
	switch s {
	case portainer.SourceStatusHealthy:
		return WorkflowPhaseStatus{Status: StatusHealthy}
	case portainer.SourceStatusError:
		return WorkflowPhaseStatus{Status: StatusError, Error: errMsg}
	default:
		return WorkflowPhaseStatus{Status: StatusUnknown}
	}
}

// ArtifactPhases returns the source and artifact-path health phases for an artifact's files,
// aggregating the worst-priority status across all of its files. The source phase also folds in
// each file's Source connectivity status, since a broken source invalidates ref resolution
// regardless of the file's own cached RefStatus.
func ArtifactPhases(files []portainer.ArtifactFile, sourceMap map[portainer.SourceID]portainer.Source) (source, artifact WorkflowPhaseStatus) {
	source = WorkflowPhaseStatus{Status: StatusUnknown}
	artifact = WorkflowPhaseStatus{Status: StatusUnknown}

	for _, f := range files {
		src, ok := sourceMap[f.SourceID]
		if !ok {
			continue
		}

		if srcPhase := SourceStatusToPhase(src.Status, src.StatusError); statusPriority(srcPhase.Status) > statusPriority(source.Status) {
			source = srcPhase
		}
		if refPhase := SourceStatusToPhase(f.RefStatus, f.RefError); statusPriority(refPhase.Status) > statusPriority(source.Status) {
			source = refPhase
		}
		if artifactPhase := SourceStatusToPhase(f.PathStatus, f.PathError); statusPriority(artifactPhase.Status) > statusPriority(artifact.Status) {
			artifact = artifactPhase
		}
	}

	return source, artifact
}

func WorkflowPhaseToStatus(p WorkflowPhaseStatus) (portainer.SourceStatus, string) {
	switch p.Status {
	case StatusHealthy:
		return portainer.SourceStatusHealthy, ""
	case StatusError:
		return portainer.SourceStatusError, p.Error
	default:
		return portainer.SourceStatusUnknown, ""
	}
}

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

// effectiveStatusOf returns the highest-priority status across the three phases of a status object.
func effectiveStatusOf(s WorkflowStatusObject) Status {
	effective := s.Target.Status
	if statusPriority(s.Source.Status) > statusPriority(effective) {
		effective = s.Source.Status
	}
	if statusPriority(s.Artifact.Status) > statusPriority(effective) {
		effective = s.Artifact.Status
	}
	return effective
}

// EffectiveStatus returns the highest-priority status across the three aggregate phases of a
// workflow.
func EffectiveStatus(w Workflow) Status {
	return effectiveStatusOf(w.Status)
}

// aggregateWorkflowStatus folds each phase (source, artifact, target) worst-wins across all of a
// workflow's artifacts. A workflow with no artifacts yields an all-unknown status object.
func aggregateWorkflowStatus(artifacts []ArtifactDetail) WorkflowStatusObject {
	agg := WorkflowStatusObject{
		Source:   WorkflowPhaseStatus{Status: StatusUnknown},
		Artifact: WorkflowPhaseStatus{Status: StatusUnknown},
		Target:   WorkflowPhaseStatus{Status: StatusUnknown},
	}
	for _, a := range artifacts {
		if statusPriority(a.Status.Source.Status) > statusPriority(agg.Source.Status) {
			agg.Source = a.Status.Source
		}
		if statusPriority(a.Status.Artifact.Status) > statusPriority(agg.Artifact.Status) {
			agg.Artifact = a.Status.Artifact
		}
		if statusPriority(a.Status.Target.Status) > statusPriority(agg.Target.Status) {
			agg.Target = a.Status.Target
		}
	}
	return agg
}

// CountByStatus counts workflows per effective aggregate status.
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
