package workflows

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// workflowDeleteStore is the minimal intersection of CE and EE DataStoreTx needed to safely delete a workflow.
type workflowDeleteStore interface {
	Workflow() dataservices.WorkflowService
}

// DetachStackArtifact removes the artifact referencing stackID from the workflow identified by
// workflowID, deleting the workflow entirely once no artifacts remain.
func DetachStackArtifact(tx workflowDeleteStore, workflowID portainer.WorkflowID, stackID portainer.StackID) error {
	return detachArtifact(tx, workflowID, func(a portainer.Artifact) bool {
		return a.StackID == stackID
	})
}

// DetachEdgeStackArtifact removes the artifact referencing edgeStackID from the workflow identified
// by workflowID, deleting the workflow entirely once no artifacts remain.
func DetachEdgeStackArtifact(tx workflowDeleteStore, workflowID portainer.WorkflowID, edgeStackID portainer.EdgeStackID) error {
	return detachArtifact(tx, workflowID, func(a portainer.Artifact) bool {
		return a.EdgeStackID == edgeStackID
	})
}

func detachArtifact(tx workflowDeleteStore, workflowID portainer.WorkflowID, match func(portainer.Artifact) bool) error {
	if workflowID == 0 {
		return nil
	}

	wf, err := tx.Workflow().Read(workflowID)
	if dataservices.IsErrObjectNotFound(err) {
		return nil
	} else if err != nil {
		return err
	}

	remaining := make([]portainer.Artifact, 0, len(wf.Artifacts))
	for _, a := range wf.Artifacts {
		if !match(a) {
			remaining = append(remaining, a)
		}
	}

	if len(remaining) == 0 {
		return tx.Workflow().Delete(workflowID)
	}

	wf.Artifacts = remaining

	return tx.Workflow().Update(workflowID, wf)
}
