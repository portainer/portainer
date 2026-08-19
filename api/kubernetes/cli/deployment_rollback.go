package cli

import (
	"context"
	"fmt"
	"sort"
	"strconv"

	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	// revisionAnnotation is the revision counter the deployment controller stamps on each
	// replica set it creates, and the number a rollout history is numbered by.
	revisionAnnotation = "deployment.kubernetes.io/revision"
	// podTemplateHashLabel is added to a replica set's pod template by the deployment
	// controller. Replaying a template still carrying it would pin the rolled-back pods
	// to the old replica set, so it is stripped first.
	podTemplateHashLabel = "pod-template-hash"
	// rollbackToPreviousRevision asks for the revision immediately before the current one.
	rollbackToPreviousRevision = 0
)

// RolloutUndo rolls a deployment back to an earlier revision by replaying the pod
// template of the replica set that recorded it, the same way kubectl rollout undo does.
// A revision of 0 selects the revision immediately before the current one.
func (kcl *KubeClient) RolloutUndo(namespace, name string, revision int64) (*appsv1.Deployment, error) {
	deployment, err := kcl.cli.AppsV1().Deployments(namespace).Get(context.TODO(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	replicaSets, err := kcl.ownedReplicaSets(namespace, deployment)
	if err != nil {
		return nil, err
	}

	target, err := selectRollbackTarget(replicaSets, revision)
	if err != nil {
		return nil, err
	}

	template := *target.Spec.Template.DeepCopy()
	delete(template.Labels, podTemplateHashLabel)
	deployment.Spec.Template = template

	rolledBack, err := kcl.cli.AppsV1().Deployments(namespace).Update(context.TODO(), deployment, metav1.UpdateOptions{})
	if err != nil {
		return nil, err
	}

	return prepareDeploymentForRead(rolledBack), nil
}

// ownedReplicaSets returns the replica sets the given deployment controls, matched by
// owner UID so that a deployment deleted and recreated under the same name does not
// inherit its predecessor's revision history.
func (kcl *KubeClient) ownedReplicaSets(namespace string, deployment *appsv1.Deployment) ([]appsv1.ReplicaSet, error) {
	list, err := kcl.cli.AppsV1().ReplicaSets(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	owned := make([]appsv1.ReplicaSet, 0, len(list.Items))
	for i := range list.Items {
		if metav1.IsControlledBy(&list.Items[i], deployment) {
			owned = append(owned, list.Items[i])
		}
	}

	return owned, nil
}

// selectRollbackTarget picks the replica set holding the requested revision, or the
// second most recent one when no revision is given.
func selectRollbackTarget(replicaSets []appsv1.ReplicaSet, revision int64) (*appsv1.ReplicaSet, error) {
	type revisionedReplicaSet struct {
		revision   int64
		replicaSet *appsv1.ReplicaSet
	}

	history := make([]revisionedReplicaSet, 0, len(replicaSets))
	for i := range replicaSets {
		parsed, err := strconv.ParseInt(replicaSets[i].Annotations[revisionAnnotation], 10, 64)
		if err != nil {
			// A replica set without a usable revision is not part of the rollout history.
			continue
		}

		history = append(history, revisionedReplicaSet{revision: parsed, replicaSet: &replicaSets[i]})
	}

	if len(history) == 0 {
		return nil, ErrNoRolloutHistory
	}

	sort.Slice(history, func(i, j int) bool { return history[i].revision < history[j].revision })

	if revision == rollbackToPreviousRevision {
		if len(history) < 2 {
			return nil, ErrNoRolloutHistory
		}

		return history[len(history)-2].replicaSet, nil
	}

	for _, entry := range history {
		if entry.revision == revision {
			return entry.replicaSet, nil
		}
	}

	return nil, fmt.Errorf("%w: revision %d", ErrRevisionNotFound, revision)
}
