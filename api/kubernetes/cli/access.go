package cli

import (
	"encoding/json"

	portainer "github.com/portainer/portainer/api"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type (
	accessPolicies struct {
		UserAccessPolicies portainer.UserAccessPolicies `json:"UserAccessPolicies"`
		TeamAccessPolicies portainer.TeamAccessPolicies `json:"TeamAccessPolicies"`
	}

	namespaceAccessPolicies map[string]accessPolicies
)

func (kcl *KubeClient) ensureNamespaceAccessesAreSet(userID int, teamIDs []int, serviceAccountName string) error {
	configMap, err := kcl.cli.CoreV1().ConfigMaps(portainerNamespace).Get(portainerConfigMapName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		return nil
	} else if err != nil {
		return err
	}

	accessData := configMap.Data[portainerConfigMapAccessPoliciesKey]

	var accessPolicies namespaceAccessPolicies
	err = json.Unmarshal([]byte(accessData), &accessPolicies)
	if err != nil {
		return err
	}

	for namespace, policies := range accessPolicies {
		if hasUserAccessToNamespace(userID, teamIDs, policies) {
			err = kcl.ensureServiceAccountHasClusterEditRoleInNamespace(serviceAccountName, namespace)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func hasUserAccessToNamespace(userID int, teamIDs []int, policies accessPolicies) bool {
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
