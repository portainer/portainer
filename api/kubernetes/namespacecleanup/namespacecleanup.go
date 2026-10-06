package namespacecleanup

import (
	"fmt"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/gitops/workflows"
)

// RemovePortainerRecords removes what Portainer stores about a namespace deleted from an environment:
// its access policies, its registry bindings and its stacks
func RemovePortainerRecords(dataStore dataservices.DataStore, kcl portainer.KubeClient, endpointID portainer.EndpointID, namespace string) error {
	if err := kcl.NamespaceAccessPoliciesDeleteNamespace(namespace); err != nil {
		return fmt.Errorf("failed to delete the access policies of namespace %s: %w", namespace, err)
	}

	return dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := removeRegistryBindings(tx, endpointID, namespace); err != nil {
			return err
		}

		return removeStacks(tx, endpointID, namespace)
	})
}

func removeRegistryBindings(tx dataservices.DataStoreTx, endpointID portainer.EndpointID, namespace string) error {
	registries, err := tx.Registry().ReadAll()
	if err != nil {
		return fmt.Errorf("failed to read registries: %w", err)
	}

	for _, registry := range registries {
		accessPolicies, ok := registry.RegistryAccesses[endpointID]
		if !ok || !slices.Contains(accessPolicies.Namespaces, namespace) {
			continue
		}

		accessPolicies.Namespaces = slices.DeleteFunc(slices.Clone(accessPolicies.Namespaces), func(ns string) bool {
			return ns == namespace
		})
		registry.RegistryAccesses[endpointID] = accessPolicies

		if err := tx.Registry().Update(registry.ID, &registry); err != nil {
			return fmt.Errorf("failed to update registry %d: %w", registry.ID, err)
		}
	}

	return nil
}

func removeStacks(tx dataservices.DataStoreTx, endpointID portainer.EndpointID, namespace string) error {
	stacks, err := tx.Stack().ReadAll(func(s portainer.Stack) bool {
		return s.Namespace == namespace && s.EndpointID == endpointID
	})
	if err != nil {
		return fmt.Errorf("failed to read stacks: %w", err)
	}

	for _, s := range stacks {
		if s.WorkflowID != 0 {
			if err := workflows.DetachStackArtifact(tx, s.WorkflowID, s.ID); err != nil {
				return err
			}
		}

		if err := tx.Stack().Delete(s.ID); err != nil {
			return fmt.Errorf("failed to delete stack %d: %w", s.ID, err)
		}
	}

	return nil
}
