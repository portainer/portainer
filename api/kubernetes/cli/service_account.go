package cli

import (
	"k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetPortainerServiceAccountBearerToken returns the Bearer token associated to the Portainer service account
// with cluster administration privileges. This service account is created as part of the Portainer/Agent deployment.
func (kcl *KubeClient) GetPortainerServiceAccountBearerToken() (string, error) {
	return kcl.getServiceAccountToken(portainerServiceAccountName)
}

// GetServiceAccountBearerToken returns the ServiceAccountToken associated to the specified user.
func (kcl *KubeClient) GetServiceAccountBearerToken(userID int, username string) (string, error) {
	serviceAccountName := userServiceAccountName(userID, username)

	return kcl.getServiceAccountToken(serviceAccountName)
}

// SetupUserServiceAccount will make sure that all the required resources are created inside the Kubernetes
// cluster before creating a ServiceAccount and a ServiceAccountToken for the specified Portainer user.
//It will also create required default RoleBinding and ClusterRoleBinding rules.
func (kcl *KubeClient) SetupUserServiceAccount(userID int, username string, teamIDs []int) error {
	serviceAccountName := userServiceAccountName(userID, username)

	err := kcl.ensureRequiredResourcesExist()
	if err != nil {
		return err
	}

	err = kcl.ensureServiceAccountForUserExists(serviceAccountName)
	if err != nil {
		return err
	}

	return kcl.ensureNamespaceAccessesAreSet(userID, teamIDs, serviceAccountName)
}

func (kcl *KubeClient) ensureRequiredResourcesExist() error {
	return kcl.createPortainerUserClusterRole()
}

func (kcl *KubeClient) ensureServiceAccountForUserExists(serviceAccountName string) error {
	err := kcl.createUserServiceAccount(portainerNamespace, serviceAccountName)
	if err != nil && !k8serrors.IsAlreadyExists(err) {
		return err
	}

	err = kcl.createServiceAccountToken(serviceAccountName)
	if err != nil && !k8serrors.IsAlreadyExists(err) {
		return err
	}

	err = kcl.ensureServiceAccountHasPortainerUserClusterRole(serviceAccountName)
	if err != nil {
		return err
	}

	return kcl.ensureServiceAccountHasClusterEditRoleInNamespace(serviceAccountName, defaultNamespace)
}

func (kcl *KubeClient) createUserServiceAccount(namespace, serviceAccountName string) error {
	_, err := kcl.cli.CoreV1().ServiceAccounts(namespace).Get(serviceAccountName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		serviceAccount := &v1.ServiceAccount{
			ObjectMeta: metav1.ObjectMeta{
				Name: serviceAccountName,
			},
		}

		_, err = kcl.cli.CoreV1().ServiceAccounts(namespace).Create(serviceAccount)
		return err
	}

	return err
}

func (kcl *KubeClient) ensureServiceAccountHasPortainerUserClusterRole(serviceAccountName string) error {
	clusterRoleBinding, err := kcl.cli.RbacV1().ClusterRoleBindings().Get(portainerUserCRBName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		clusterRoleBinding = &rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name: portainerUserCRBName,
			},
			Subjects: []rbacv1.Subject{
				{
					Kind:      "ServiceAccount",
					Name:      serviceAccountName,
					Namespace: portainerNamespace,
				},
			},
			RoleRef: rbacv1.RoleRef{
				Kind: "ClusterRole",
				Name: portainerUserCRName,
			},
		}

		_, err := kcl.cli.RbacV1().ClusterRoleBindings().Create(clusterRoleBinding)
		return err
	} else if err != nil {
		return err
	}

	for _, subject := range clusterRoleBinding.Subjects {
		if subject.Name == serviceAccountName {
			return nil
		}
	}

	clusterRoleBinding.Subjects = append(clusterRoleBinding.Subjects, rbacv1.Subject{
		Kind:      "ServiceAccount",
		Name:      serviceAccountName,
		Namespace: portainerNamespace,
	})

	_, err = kcl.cli.RbacV1().ClusterRoleBindings().Update(clusterRoleBinding)
	return err
}

func (kcl *KubeClient) ensureServiceAccountHasClusterEditRoleInNamespace(serviceAccountName, namespace string) error {
	roleBindingName := namespaceClusterRoleBindingName(namespace)

	roleBinding, err := kcl.cli.RbacV1().RoleBindings(namespace).Get(roleBindingName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		roleBinding = &rbacv1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name: roleBindingName,
			},
			Subjects: []rbacv1.Subject{
				{
					Kind:      "ServiceAccount",
					Name:      serviceAccountName,
					Namespace: portainerNamespace,
				},
			},
			RoleRef: rbacv1.RoleRef{
				Kind: "ClusterRole",
				Name: "edit",
			},
		}

		_, err = kcl.cli.RbacV1().RoleBindings(portainerNamespace).Create(roleBinding)
		return err
	} else if err != nil {
		return err
	}

	for _, subject := range roleBinding.Subjects {
		if subject.Name == serviceAccountName {
			return nil
		}
	}

	roleBinding.Subjects = append(roleBinding.Subjects, rbacv1.Subject{
		Kind:      "ServiceAccount",
		Name:      serviceAccountName,
		Namespace: portainerNamespace,
	})

	_, err = kcl.cli.RbacV1().RoleBindings(portainerNamespace).Update(roleBinding)
	return err
}
