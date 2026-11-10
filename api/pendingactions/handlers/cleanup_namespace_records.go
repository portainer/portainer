package handlers

import (
	"fmt"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/kubernetes/namespacecleanup"
	"github.com/portainer/portainer/api/pendingactions/actions"

	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

type (
	HandlerCleanupNamespaceRecords struct {
		dataStore   dataservices.DataStore
		kubeFactory *kubecli.ClientFactory
	}

	cleanupNamespaceRecordsData struct {
		Namespace string `json:"Namespace"`
		// NamespaceUID identifies the deleted namespace, empty when it could not be read when the cleanup was queued
		NamespaceUID string `json:"NamespaceUID"`
	}
)

const cleanupNamespaceRecordsLogContext = "CleanupNamespaceRecords"

// NewCleanupNamespaceRecords creates a pending action that removes the Portainer records of a namespace
// already deleted from the environment. The namespace UID tells the deleted namespace apart from one
// recreated later with the same name
func NewCleanupNamespaceRecords(endpointID portainer.EndpointID, namespace, namespaceUID string) portainer.PendingAction {
	return portainer.PendingAction{
		EndpointID: endpointID,
		Action:     actions.CleanupNamespaceRecords,
		ActionData: &cleanupNamespaceRecordsData{Namespace: namespace, NamespaceUID: namespaceUID},
	}
}

// NewHandlerCleanupNamespaceRecords creates a new handler to execute CleanupNamespaceRecords pending actions
func NewHandlerCleanupNamespaceRecords(dataStore dataservices.DataStore, kubeFactory *kubecli.ClientFactory) *HandlerCleanupNamespaceRecords {
	return &HandlerCleanupNamespaceRecords{
		dataStore:   dataStore,
		kubeFactory: kubeFactory,
	}
}

func (h *HandlerCleanupNamespaceRecords) Execute(pa portainer.PendingAction, endpoint *portainer.Endpoint) error {
	if endpoint == nil || pa.ActionData == nil {
		return nil
	}

	var data cleanupNamespaceRecordsData
	if err := pa.UnmarshallActionData(&data); err != nil {
		return err
	}

	kubeClient, err := h.kubeFactory.GetPrivilegedKubeClient(endpoint)
	if err != nil {
		return fmt.Errorf("failed to get kube client for environment %d: %w", endpoint.ID, err)
	}

	recreated, err := namespaceRecreated(kubeClient, data)
	if err != nil {
		return err
	}

	if recreated {
		log.Warn().
			Str("context", cleanupNamespaceRecordsLogContext).
			Str("namespace", data.Namespace).
			Int("endpoint_id", int(endpoint.ID)).
			Msg("Namespace was recreated before its Portainer records could be cleaned up, keeping them")

		return nil
	}

	return namespacecleanup.RemovePortainerRecords(h.dataStore, kubeClient, endpoint.ID, data.Namespace)
}

// namespaceRecreated reports whether the namespace that exists under the deleted namespace's name is a new
// one, whose records must be kept. The deleted namespace can still exist, in any phase, while it terminates
func namespaceRecreated(kcl portainer.KubeClient, data cleanupNamespaceRecordsData) (bool, error) {
	info, err := kcl.GetNamespace(data.Namespace)
	if k8serrors.IsNotFound(err) {
		return false, nil
	}

	if err != nil {
		return false, fmt.Errorf("failed to get namespace %s: %w", data.Namespace, err)
	}

	if data.NamespaceUID == "" {
		return false, fmt.Errorf("namespace %s still exists and cannot be told apart from the deleted one, retrying once it is gone", data.Namespace)
	}

	return info.Id != data.NamespaceUID, nil
}
