package cli

import (
	"fmt"

	"github.com/gofrs/uuid"
)

const (
	defaultNamespace                    = "default"
	portainerNamespace                  = "portainer"
	portainerUserCRName                 = "portainer-cr-user"
	portainerUserCRBName                = "portainer-crb-user"
	portainerUserServiceAccountPrefix   = "portainer-sa-user"
	portainerRBPrefix                   = "portainer-rb"
	portainerConfigMapName              = "portainer-config"
	portainerConfigMapAccessPoliciesKey = "NamespaceAccessPolicies"
	portainerShellPodPrefix             = "portainer-pod-kubectl-shell"
)

func userServiceAccountName(userID int, instanceID string) string {
	return fmt.Sprintf("%s-%s-%d", portainerUserServiceAccountPrefix, instanceID, userID)
}

func userServiceAccountTokenSecretName(serviceAccountName string, instanceID string) string {
	return fmt.Sprintf("%s-%s-secret", instanceID, serviceAccountName)
}

func namespaceClusterRoleBindingName(namespace string, instanceID string) string {
	return fmt.Sprintf("%s-%s-%s", portainerRBPrefix, instanceID, namespace)
}

func userShellPodName(serviceAccountName string) (string, error) {
	uid, err := uuid.NewV4()
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s-%s-%s", portainerShellPodPrefix, serviceAccountName, uid), nil
}
