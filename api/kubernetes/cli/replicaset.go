package cli

import (
	"context"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
	appsv1 "k8s.io/api/apps/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetReplicaSets gets the replica sets in the given namespace. When ownerDeployment
// is set, the namespace is required and only the replica sets controlled by that
// deployment are returned, which backs the deployment revision history view. Each
// returned replica set keeps its full pod template (revision rollback replays it)
// but is trimmed of server-managed and heavy fields.
// if the user is an admin, all replica sets in the namespace are considered.
// otherwise, namespaces the non-admin user has access to are used to filter the replica sets.
func (kcl *KubeClient) GetReplicaSets(namespace, ownerDeployment string, opts models.K8sResourceListOptions) ([]appsv1.ReplicaSet, error) {
	replicaSets, err := kcl.listReplicaSetsForUser(namespace, opts)
	if err != nil {
		return nil, err
	}

	// The owner is resolved even when no replica sets are visible, so that a
	// deployment that does not exist is reported as not found rather than as an
	// empty list.
	var ownerDeploymentObject *appsv1.Deployment
	if ownerDeployment != "" {
		ownerDeploymentObject, err = kcl.GetDeployment(namespace, ownerDeployment)
		if err != nil {
			return nil, err
		}
	}

	results := make([]appsv1.ReplicaSet, 0, len(replicaSets))
	for i := range replicaSets {
		if ownerDeploymentObject != nil && !metav1.IsControlledBy(&replicaSets[i], ownerDeploymentObject) {
			continue
		}

		trimReplicaSetForRead(&replicaSets[i])
		// Typed List leaves TypeMeta empty; set it so consumers can rely on Kind.
		replicaSets[i].TypeMeta = metav1.TypeMeta{Kind: "ReplicaSet", APIVersion: "apps/v1"}
		results = append(results, replicaSets[i])
	}

	return results, nil
}

// listReplicaSetsForUser lists the replica sets the current user is allowed to see.
func (kcl *KubeClient) listReplicaSetsForUser(namespace string, opts models.K8sResourceListOptions) ([]appsv1.ReplicaSet, error) {
	if kcl.GetIsKubeAdmin() {
		return kcl.getReplicaSets(namespace, opts)
	}

	return kcl.getReplicaSetsForNonAdmin(namespace, opts)
}

// getReplicaSetsForNonAdmin fetches the replica sets in the namespaces the user has access to.
// This function is called when the user is not an admin.
func (kcl *KubeClient) getReplicaSetsForNonAdmin(namespace string, opts models.K8sResourceListOptions) ([]appsv1.ReplicaSet, error) {
	nonAdminNamespaces := kcl.GetClientNonAdminNamespaces()

	log.Debug().
		Strs("non_admin_namespaces", nonAdminNamespaces).
		Msg("fetching replica sets for non-admin user")

	if len(nonAdminNamespaces) == 0 {
		return nil, nil
	}

	replicaSets, err := kcl.getReplicaSets(namespace, opts)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := []appsv1.ReplicaSet{}
	for _, replicaSet := range replicaSets {
		if _, ok := nonAdminNamespaceSet[replicaSet.Namespace]; ok {
			results = append(results, replicaSet)
		}
	}

	return results, nil
}

func (kcl *KubeClient) getReplicaSets(namespace string, opts models.K8sResourceListOptions) ([]appsv1.ReplicaSet, error) {
	replicaSets, err := kcl.cli.AppsV1().ReplicaSets(namespace).List(context.TODO(), metav1.ListOptions{
		LabelSelector: opts.LabelSelector,
		FieldSelector: opts.FieldSelector,
	})
	if err != nil {
		return nil, err
	}

	return replicaSets.Items, nil
}

// trimReplicaSetForRead removes server-managed and heavy fields that read consumers
// do not need, keeping the pod template (needed for revision rollback), spec and status.
func trimReplicaSetForRead(replicaSet *appsv1.ReplicaSet) {
	replicaSet.ManagedFields = nil
	delete(replicaSet.Annotations, lastAppliedConfigAnnotation)
}
