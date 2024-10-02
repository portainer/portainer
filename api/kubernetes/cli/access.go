package cli

import (
	"context"
	"fmt"

	portainer "github.com/portainer/portainer/api"

	"github.com/pkg/errors"
	"github.com/segmentio/encoding/json"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// NamespaceAccessPoliciesDeleteNamespace removes stored policies associated with a given namespace
func (kcl *KubeClient) NamespaceAccessPoliciesDeleteNamespace(ns string) error {
	kcl.mu.Lock()
	defer kcl.mu.Unlock()

	policies, err := kcl.GetNamespaceAccessPolicies()
	if err != nil {
		return errors.WithMessage(err, "failed to fetch access policies")
	}

	if policies != nil {
		delete(policies, ns)
		return kcl.UpdateNamespaceAccessPolicies(policies)
	}

	return nil
}

// GetNamespaceAccessPolicies gets the namespace access policies
// from config maps in the portainer namespace
func (kcl *KubeClient) GetNamespaceAccessPolicies() (map[string]portainer.K8sNamespaceAccessPolicy, error) {
	configMap, err := kcl.cli.CoreV1().ConfigMaps(portainerNamespace).Get(context.TODO(), portainerConfigMapName, metav1.GetOptions{})
	if err != nil {
		if k8serrors.IsNotFound(err) {
			return nil, nil
		}
		return nil, err
	}

	accessData := configMap.Data[portainerConfigMapAccessPoliciesKey]
	policies := map[string]portainer.K8sNamespaceAccessPolicy{}
	err = json.Unmarshal([]byte(accessData), &policies)
	if err != nil {
		return nil, err
	}

	return policies, nil
}

func (kcl *KubeClient) setupNamespaceAccesses(userID int, teamIDs []int, serviceAccountName string, restrictDefaultNamespace bool) error {
	accessPolicies, err := kcl.GetNamespaceAccessPolicies()
	if err != nil {
		return err
	}

	namespaces, err := kcl.cli.CoreV1().Namespaces().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return err
	}

	for _, namespace := range namespaces.Items {
		if namespace.Name == defaultNamespace && !restrictDefaultNamespace {
			err = kcl.ensureNamespaceAccessForServiceAccount(serviceAccountName, defaultNamespace)
			if err != nil {
				return err
			}
			continue
		}

		policies, ok := accessPolicies[namespace.Name]
		if !ok || !hasUserAccessToNamespace(userID, teamIDs, policies) {
			err = kcl.removeNamespaceAccessForServiceAccount(serviceAccountName, namespace.Name)
			if err != nil {
				return err
			}
			continue
		}

		err = kcl.ensureNamespaceAccessForServiceAccount(serviceAccountName, namespace.Name)
		if err != nil && !k8serrors.IsAlreadyExists(err) {
			return err
		}
	}

	return nil
}

func hasUserAccessToNamespace(userID int, teamIDs []int, policies portainer.K8sNamespaceAccessPolicy) bool {
	_, userAccess := policies.UserAccessPolicies[portainer.UserID(userID)]
	if userAccess {
		return true
	}

	for _, teamID := range teamIDs {
		_, teamAccess := policies.TeamAccessPolicies[portainer.TeamID(teamID)]
		if teamAccess {
			return true
		}
	}

	return false
}

// UpdateNamespaceAccessPolicies updates the namespace access policies
func (kcl *KubeClient) UpdateNamespaceAccessPolicies(accessPolicies map[string]portainer.K8sNamespaceAccessPolicy) error {
	data, err := json.Marshal(accessPolicies)
	if err != nil {
		return err
	}

	configMap, err := kcl.cli.CoreV1().ConfigMaps(portainerNamespace).Get(context.TODO(), portainerConfigMapName, metav1.GetOptions{})
	if err != nil {
		return err
	}

	configMap.Data[portainerConfigMapAccessPoliciesKey] = string(data)
	_, err = kcl.cli.CoreV1().ConfigMaps(portainerNamespace).Update(context.TODO(), configMap, metav1.UpdateOptions{})

	return err
}

// GetNonAdminNamespaces retrieves namespaces for a non-admin user, excluding the default namespace if restricted.
func (kcl *KubeClient) GetNonAdminNamespaces(userID int, isRestrictDefaultNamespace bool) ([]string, error) {
	accessPolicies, err := kcl.GetNamespaceAccessPolicies()
	if err != nil {
		return nil, fmt.Errorf("an error occurred during the getNonAdminNamespaces operation, unable to get namespace access policies via portainer-config. check if portainer-config configMap exists in the Kubernetes cluster: %w", err)
	}

	nonAdminNamespaces := []string{}
	if !isRestrictDefaultNamespace {
		nonAdminNamespaces = append(nonAdminNamespaces, defaultNamespace)
	}

	for namespace, accessPolicy := range accessPolicies {
		if hasUserAccessToNamespace(userID, nil, accessPolicy) {
			nonAdminNamespaces = append(nonAdminNamespaces, namespace)
		}
	}

	return nonAdminNamespaces, nil
}
