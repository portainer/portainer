package cli

import "fmt"

const (
	defaultNamespace                    = "default"
	portainerNamespace                  = "portainer"
	portainerUserCRName                 = "portainer-cr-user"
	portainerUserCRBName                = "portainer-crb-user"
	portainerUserServiceAccountPrefix   = "portainer-sa-user"
	portainerRBPrefix                   = "portainer-rb"
	portainerConfigMapName              = "portainer-config"
	portainerConfigMapAccessPoliciesKey = "NamespaceAccessPolicies"
)

func userServiceAccountName(userID int) string {
	return fmt.Sprintf("%s-%d", portainerUserServiceAccountPrefix, userID)
}

func userServiceAccountTokenSecretName(serviceAccountName string) string {
	return fmt.Sprintf("%s-secret", serviceAccountName)
}

func namespaceClusterRoleBindingName(namespace string) string {
	return fmt.Sprintf("%s-%s", portainerRBPrefix, namespace)
}
