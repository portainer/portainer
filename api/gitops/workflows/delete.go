package workflows

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

// workflowDeleteStore is the minimal intersection of CE and EE DataStoreTx needed to safely delete a workflow.
type workflowDeleteStore interface {
	Workflow() dataservices.WorkflowService
}

// DeleteIfSingleArtifact deletes the workflow identified by workflowID, but only when it has a
// single artifact.
func DeleteIfSingleArtifact(tx workflowDeleteStore, workflowID portainer.WorkflowID) error {
	if workflowID == 0 {
		return nil
	}

	wf, err := tx.Workflow().Read(workflowID)
	if dataservices.IsErrObjectNotFound(err) {
		return nil
	} else if err != nil {
		return err
	}

	if len(wf.Artifacts) > 1 {
		return nil
	}

	return tx.Workflow().Delete(workflowID)
}
