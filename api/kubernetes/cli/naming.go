package cli

import "fmt"

const (
	defaultNamespace                    = "default"
	portainerNamespace                  = "ns-portainer"
	portainerUserCRName                 = "portainer-cr-user"
	portainerUserCRBName                = "portainer-crb-user"
	portainerUserServiceAccountPrefix   = "portainer-sa-user"
	portainerRBPrefix                   = "portainer-rb"
	portainerConfigMapName              = "portainer-config"
	portainerConfigMapAccessPoliciesKey = "NamespaceAccessPolicies"
)

func userServiceAccountName(userID int, username string) string {
	return fmt.Sprintf("%s-%d-%s", portainerUserServiceAccountPrefix, userID, username)
}

func userServiceAccountTokenSecretName(serviceAccountName string) string {
	return fmt.Sprintf("%s-secret", serviceAccountName)
}

func namespaceClusterRoleBindingName(namespace string) string {
	return fmt.Sprintf("%s-%s", portainerRBPrefix, namespace)
}
