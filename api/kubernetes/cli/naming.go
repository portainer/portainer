package cli

import (
	"fmt"
	"regexp"
)

const (
	defaultNamespace                    = "default"
	portainerNamespace                  = "portainer"
	portainerUserServiceAccountPrefix   = "portainer-sa-user"
	portainerRBPrefix                   = "portainer-rb"
	portainerCRBPrefix                  = "portainer-crb"
	portainerConfigMapName              = "portainer-config"
	portainerConfigMapAccessPoliciesKey = "NamespaceAccessPolicies"
)

func userServiceAccountName(userID int, instanceID string) string {
	return fmt.Sprintf("%s-%s-%d", portainerUserServiceAccountPrefix, instanceID, userID)
}

func userServiceAccountTokenSecretName(serviceAccountName string, instanceID string) string {
	return fmt.Sprintf("%s-%s-secret", instanceID, serviceAccountName)
}

func clusterRoleBindingName(roleName string, instanceID string) string {
	return fmt.Sprintf("%s-%s-%s", portainerCRBPrefix, instanceID, roleName)
}

func namespaceRoleBindingName(roleName string, namespace string, instanceID string) string {
	return fmt.Sprintf("%s-%s-%s-%s", portainerRBPrefix, instanceID, namespace, roleName)
}

// match with a portainer role binding for any role name
func matchRoleBindingName(target string, namespace string, instanceID string) bool {
	return regexp.MustCompile("^" + namespaceRoleBindingName("(.*)", namespace, instanceID) + "$").
		MatchString(target)
}

// match with a portainer cluster role binding for any role name
func matchClusterRoleBindingName(target string, instanceID string) bool {
	return regexp.MustCompile("^" + clusterRoleBindingName("(.*)", instanceID) + "$").
		MatchString(target)
}
