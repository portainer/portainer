package cli

import (
	"context"
	"fmt"

	portainer "github.com/portainer/portainer/api"
	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/internal/errorlist"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetServiceAccounts gets all the service accounts for either at the cluster level or a given namespace in a k8s endpoint.
// It returns a list of K8sServiceAccount objects.
func (kcl *KubeClient) GetServiceAccounts(namespace string) ([]models.K8sServiceAccount, error) {
	if kcl.IsKubeAdmin {
		return kcl.fetchServiceAccounts(namespace)
	}

	return kcl.fetchServiceAccountsForNonAdmin(namespace)
}

// fetchServiceAccountsForNonAdmin gets all the service accounts for either at the cluster level or a given namespace in a k8s endpoint.
// the namespace will be coming from NonAdminNamespaces as non-admin users are restricted to certain namespaces.
// it returns a list of K8sServiceAccount objects.
func (kcl *KubeClient) fetchServiceAccountsForNonAdmin(namespace string) ([]models.K8sServiceAccount, error) {
	serviceAccounts, err := kcl.fetchServiceAccounts(namespace)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sServiceAccount, 0)
	for _, serviceAccount := range serviceAccounts {
		if _, ok := nonAdminNamespaceSet[serviceAccount.Namespace]; ok {
			results = append(results, serviceAccount)
		}
	}

	return results, nil
}

// fetchServiceAccounts returns a list of all ServiceAccounts in the specified namespace.
func (kcl *KubeClient) fetchServiceAccounts(namespace string) ([]models.K8sServiceAccount, error) {
	serviceAccounts, err := kcl.cli.CoreV1().ServiceAccounts(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := make([]models.K8sServiceAccount, 0)
	for _, serviceAccount := range serviceAccounts.Items {
		results = append(results, kcl.parseServiceAccount(serviceAccount))
	}

	return results, nil
}

// parseServiceAccount converts a corev1.ServiceAccount object to a models.K8sServiceAccount object.
func (kcl *KubeClient) parseServiceAccount(serviceAccount corev1.ServiceAccount) models.K8sServiceAccount {
	return models.K8sServiceAccount{
		Name:         serviceAccount.Name,
		UID:          serviceAccount.UID,
		Namespace:    serviceAccount.Namespace,
		CreationDate: serviceAccount.CreationTimestamp.Time,
		IsSystem:     kcl.isSystemServiceAccount(serviceAccount.Namespace),
	}
}

// GetPortainerUserServiceAccount returns the portainer ServiceAccountName associated to the specified user.
func (kcl *KubeClient) GetPortainerUserServiceAccount(tokenData *portainer.TokenData) (*corev1.ServiceAccount, error) {
	portainerUserServiceAccountName := UserServiceAccountName(int(tokenData.ID), kcl.instanceID)
	if tokenData.Role == portainer.AdministratorRole {
		portainerUserServiceAccountName = portainerClusterAdminServiceAccountName
	}

	// verify name exists as service account resource within portainer namespace
	serviceAccount, err := kcl.cli.CoreV1().ServiceAccounts(portainerNamespace).Get(context.TODO(), portainerUserServiceAccountName, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	return serviceAccount, nil
}

func (kcl *KubeClient) isSystemServiceAccount(namespace string) bool {
	return kcl.isSystemNamespace(namespace)
}

// DeleteServices processes a K8sServiceDeleteRequest by deleting each service
// in its given namespace.
func (kcl *KubeClient) DeleteServiceAccounts(reqs models.K8sServiceAccountDeleteRequests) error {
	var errors []error
	for namespace := range reqs {
		for _, serviceName := range reqs[namespace] {
			client := kcl.cli.CoreV1().ServiceAccounts(namespace)

			sa, err := client.Get(context.Background(), serviceName, metav1.GetOptions{})
			if err != nil {
				if k8serrors.IsNotFound(err) {
					continue
				}

				return err
			}

			if kcl.isSystemServiceAccount(sa.Namespace) {
				return fmt.Errorf("cannot delete system service account %q", namespace+"/"+serviceName)
			}

			if err := client.Delete(context.Background(), serviceName, metav1.DeleteOptions{}); err != nil {
				errors = append(errors, err)
			}
		}
	}

	return errorlist.Combine(errors)
}

// GetServiceAccountBearerToken returns the ServiceAccountToken associated to the specified user.
func (kcl *KubeClient) GetServiceAccountBearerToken(userID int) (string, error) {
	serviceAccountName := UserServiceAccountName(userID, kcl.instanceID)

	return kcl.getServiceAccountToken(serviceAccountName)
}

// SetupUserServiceAccount will make sure that all the required resources are created inside the Kubernetes
// cluster before creating a ServiceAccount and a ServiceAccountToken for the specified Portainer user.
// It will also create required default RoleBinding and ClusterRoleBinding rules.
func (kcl *KubeClient) SetupUserServiceAccount(userID int, teamIDs []int, restrictDefaultNamespace bool) error {
	serviceAccountName := UserServiceAccountName(userID, kcl.instanceID)

	err := kcl.ensureRequiredResourcesExist()
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

	err = kcl.ensureServiceAccountHasPortainerUserClusterRole(serviceAccountName)
	if err != nil {
		return err
	}

	return kcl.setupNamespaceAccesses(userID, teamIDs, serviceAccountName, restrictDefaultNamespace)
}

func (kcl *KubeClient) ensureRequiredResourcesExist() error {
	return kcl.upsertPortainerK8sClusterRoles()
}

func (kcl *KubeClient) createUserServiceAccount(namespace, serviceAccountName string) error {
	serviceAccount := &corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name: serviceAccountName,
		},
	}

	_, err := kcl.cli.CoreV1().ServiceAccounts(namespace).Create(context.TODO(), serviceAccount, metav1.CreateOptions{})
	if err != nil && !k8serrors.IsAlreadyExists(err) {
		return err
	}

	return nil
}

func (kcl *KubeClient) ensureServiceAccountHasPortainerUserClusterRole(serviceAccountName string) error {
	clusterRoleBinding, err := kcl.cli.RbacV1().ClusterRoleBindings().Get(context.TODO(), portainerUserCRBName, metav1.GetOptions{})
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

		_, err := kcl.cli.RbacV1().ClusterRoleBindings().Create(context.TODO(), clusterRoleBinding, metav1.CreateOptions{})
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

	_, err = kcl.cli.RbacV1().ClusterRoleBindings().Update(context.TODO(), clusterRoleBinding, metav1.UpdateOptions{})
	return err
}

func (kcl *KubeClient) removeNamespaceAccessForServiceAccount(serviceAccountName, namespace string) error {
	roleBindingName := namespaceClusterRoleBindingName(namespace, kcl.instanceID)

	roleBinding, err := kcl.cli.RbacV1().RoleBindings(namespace).Get(context.TODO(), roleBindingName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		return nil
	} else if err != nil {
		return err
	}

	updatedSubjects := roleBinding.Subjects[:0]

	for _, subject := range roleBinding.Subjects {
		if subject.Name != serviceAccountName {
			updatedSubjects = append(updatedSubjects, subject)
		}
	}

	roleBinding.Subjects = updatedSubjects

	_, err = kcl.cli.RbacV1().RoleBindings(namespace).Update(context.TODO(), roleBinding, metav1.UpdateOptions{})
	return err
}

func (kcl *KubeClient) ensureNamespaceAccessForServiceAccount(serviceAccountName, namespace string) error {
	roleBindingName := namespaceClusterRoleBindingName(namespace, kcl.instanceID)

	roleBinding, err := kcl.cli.RbacV1().RoleBindings(namespace).Get(context.TODO(), roleBindingName, metav1.GetOptions{})
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

		_, err = kcl.cli.RbacV1().RoleBindings(namespace).Create(context.TODO(), roleBinding, metav1.CreateOptions{})
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

	_, err = kcl.cli.RbacV1().RoleBindings(namespace).Update(context.TODO(), roleBinding, metav1.UpdateOptions{})
	return err
}
