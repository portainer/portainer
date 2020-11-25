package cli

import (
	"fmt"
	"log"

	portainer "github.com/portainer/portainer/api"
	v1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetServiceAccountBearerToken returns the ServiceAccountToken associated to the specified user.
func (kcl *KubeClient) GetServiceAccountBearerToken(userID int) (string, error) {
	serviceAccountName := userServiceAccountName(userID, kcl.instanceID)

	return kcl.getServiceAccountToken(serviceAccountName)
}

// SetupUserServiceAccount will make sure that all the required resources are created inside the Kubernetes
// cluster before creating a ServiceAccount and a ServiceAccountToken for the specified Portainer user.
//It will also create required default RoleBinding and ClusterRoleBinding rules.
func (kcl *KubeClient) SetupUserServiceAccount(
	user portainer.User,
	endpointRoleID portainer.RoleID,
	namespaces map[string]portainer.K8sNamespaceInfo,
	namespaceRoles map[string]portainer.Role,
) error {
	serviceAccountName := userServiceAccountName(int(user.ID), kcl.instanceID)

	err := kcl.createPortainerK8sClusterRoles()
	if err != nil {
		return err
	}

	err = kcl.createUserServiceAccount(portainerNamespace, serviceAccountName)
	if err != nil {
		return err
	}

	err = kcl.createServiceAccountToken(serviceAccountName)
	if err != nil {
		return err
	}

	err = kcl.ensureServiceAccountHasPortainerClusterRoles(
		serviceAccountName, user, endpointRoleID)
	if err != nil {
		return err
	}

	return kcl.ensureServiceAccountHasPortainerRoles(
		serviceAccountName, namespaces, namespaceRoles)
}

// RemoveUserServiceAccount removes the service account and its
// role binding, cluster role binding.
func (kcl *KubeClient) RemoveUserServiceAccount(
	userID int,
) error {
	serviceAccountName := userServiceAccountName(userID, kcl.instanceID)

	err := kcl.removeRoleBindings(serviceAccountName)
	if err != nil {
		return err
	}

	err = kcl.removeClusterRoleBindings(serviceAccountName)
	if err != nil {
		return err
	}

	err = kcl.removeUserServiceAccount(portainerNamespace, serviceAccountName)

	return err
}

func (kcl *KubeClient) createUserServiceAccount(namespace, serviceAccountName string) error {
	serviceAccount := &v1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name: serviceAccountName,
		},
	}
	_, err := kcl.cli.CoreV1().ServiceAccounts(namespace).Create(serviceAccount)
	if err != nil && !k8serrors.IsAlreadyExists(err) {
		return err
	}
	log.Printf("[DEBUG][RBAC] created service account %s", serviceAccount)

	return nil
}

func (kcl *KubeClient) removeUserServiceAccount(namespace, serviceAccountName string) error {
	err := kcl.cli.CoreV1().ServiceAccounts(namespace).Delete(serviceAccountName, &metav1.DeleteOptions{})
	if err != nil && !k8serrors.IsNotFound(err) {
		return err
	}

	return nil
}

// setup cluster role binding for a service account
func (kcl *KubeClient) ensureServiceAccountHasPortainerClusterRoles(
	serviceAccountName string,
	user portainer.User,
	endpointRoleID portainer.RoleID,
) error {

	roleSet, ok := getPortainerK8sRoleMapping()[endpointRoleID]
	if !ok {
		return nil
	}

	kcl.removeClusterRoleBindings(serviceAccountName)

	for _, role := range roleSet.k8sClusterRoles {
		err := kcl.createClusterRoleBindings(serviceAccountName, string(role))
		if err != nil {
			return err
		}
	}

	return nil
}

// setup role binding for a service account
func (kcl *KubeClient) ensureServiceAccountHasPortainerRoles(
	serviceAccountName string,
	namespaces map[string]portainer.K8sNamespaceInfo,
	namespaceRoles map[string]portainer.Role,
) error {
	rolesMapping := getPortainerK8sRoleMapping()

	for namespace := range namespaces {

		// remove the namespace access from the service account
		err := kcl.removeRoleBinding(serviceAccountName, namespace)
		if err != nil {
			return err
		}

		// namespace roles should contain the default namespace access too
		nsRole, ok := namespaceRoles[namespace]
		if !ok {
			continue
		}

		debug := ""
		for ns, r := range namespaceRoles {
			debug = fmt.Sprintf("%s%s:%s;", debug, ns, r.Name)
		}
		log.Printf("[DEBUG][RBAC] binding roles (%v) for sa %s @ %s", debug, serviceAccountName, namespace)

		// setup k8s role bindings for the namespace based on user's namespace role
		roleSet := rolesMapping[nsRole.ID]
		for _, role := range roleSet.k8sRoles {
			err = kcl.createRoleBinding(serviceAccountName, string(role), namespace, true)
			if err != nil && !k8serrors.IsAlreadyExists(err) {
				return err
			}
		}
	}

	return nil
}
