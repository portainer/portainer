package kubernetes

import (
	"errors"
	"fmt"
	"time"

	"k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

const (
	defaultNamespace     = "default"
	portainerNamespace   = "ns-portainer"
	namespaceListCRName  = "portainer-cr-list-namespaces"
	namespaceListCRBName = "portainer-crb-list-namespaces"
	defaultRBName        = "portainer-rb-default"
)

type KubeClient struct {
	cli *kubernetes.Clientset
}

// GetServiceAccountBearerToken will make sure that all the required resources are created inside the Kubernetes
// cluster before creating a ServiceAccount for the specified Portainer user. It will also create required
// default RoleBinding and ClusterRoleBinding rules.
// Finally, it will retrieve the Bearer token associated to the ServiceAccount.
func (kcl *KubeClient) GetServiceAccountBearerToken(userID int, username string) (string, error) {
	serviceAccountName := fmt.Sprintf("portainer-sa-%d-%s", userID, username)

	err := kcl.ensureRequiredResourcesExist()
	if err != nil {
		return "", err
	}

	err = kcl.ensureServiceAccountForUserExists(serviceAccountName)
	if err != nil {
		return "", err
	}

	return kcl.getSecretTokenFromServiceAccount(serviceAccountName)
}

func (kcl *KubeClient) ensureRequiredResourcesExist() error {
	return kcl.createClusterNamespaceListRole()
}

func (kcl *KubeClient) ensureServiceAccountForUserExists(serviceAccountName string) error {
	err := kcl.createUserServiceAccount(portainerNamespace, serviceAccountName)
	if err != nil && !k8serrors.IsAlreadyExists(err) {
		return err
	}

	err = kcl.ensureServiceAccountHasClusterNamespaceListRole(serviceAccountName)
	if err != nil {
		return err
	}

	return kcl.ensureServiceAccountHasEditRoleInDefaultNamespace(serviceAccountName)
}

func (kcl *KubeClient) createClusterNamespaceListRole() error {
	_, err := kcl.cli.RbacV1().ClusterRoles().Get(namespaceListCRName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		clusterRole := &rbacv1.ClusterRole{
			ObjectMeta: metav1.ObjectMeta{
				Name: namespaceListCRName,
			},
			Rules: []rbacv1.PolicyRule{
				{
					Verbs:     []string{"list"},
					Resources: []string{"namespaces"},
					APIGroups: []string{""},
				},
			},
		}

		_, err := kcl.cli.RbacV1().ClusterRoles().Create(clusterRole)
		if err != nil {
			return err
		}

		return nil
	}

	return err
}

func (kcl *KubeClient) createUserServiceAccount(namespace, serviceAccountName string) error {
	_, err := kcl.cli.CoreV1().ServiceAccounts(namespace).Get(serviceAccountName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		serviceAccount := &v1.ServiceAccount{
			ObjectMeta: metav1.ObjectMeta{
				Name: serviceAccountName,
			},
		}

		serviceAccount, err = kcl.cli.CoreV1().ServiceAccounts(namespace).Create(serviceAccount)
		if err != nil {
			return err
		}

		return nil
	}

	return err
}

func (kcl *KubeClient) ensureServiceAccountHasClusterNamespaceListRole(serviceAccountName string) error {
	clusterRoleBinding, err := kcl.cli.RbacV1().ClusterRoleBindings().Get(namespaceListCRBName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		clusterRoleBinding = &rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name: namespaceListCRBName,
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
				Name: namespaceListCRName,
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

func (kcl *KubeClient) ensureServiceAccountHasEditRoleInDefaultNamespace(serviceAccountName string) error {
	roleBinding, err := kcl.cli.RbacV1().RoleBindings(defaultNamespace).Get(defaultRBName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		roleBinding = &rbacv1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{
				Name: defaultRBName,
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

		_, err = kcl.cli.RbacV1().RoleBindings(defaultNamespace).Create(roleBinding)
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

	_, err = kcl.cli.RbacV1().RoleBindings(defaultNamespace).Update(roleBinding)
	return err
}

func (kcl *KubeClient) getSecretTokenFromServiceAccount(serviceAccountName string) (string, error) {
	serviceAccountSecretName := fmt.Sprintf("%s-secret", serviceAccountName)

	secret, err := kcl.cli.CoreV1().Secrets(portainerNamespace).Get(serviceAccountSecretName, metav1.GetOptions{})
	if k8serrors.IsNotFound(err) {
		serviceAccountSecret := &v1.Secret{
			TypeMeta: metav1.TypeMeta{},
			ObjectMeta: metav1.ObjectMeta{
				Name: serviceAccountSecretName,
				Annotations: map[string]string{
					"kubernetes.io/service-account.name": serviceAccountName,
				},
			},
			Type: "kubernetes.io/service-account-token",
		}

		secret, err = kcl.cli.CoreV1().Secrets(portainerNamespace).Create(serviceAccountSecret)
		if err != nil {
			return "", err
		}
	} else if err != nil {
		return "", err
	}

	// API token secret is populated asynchronously.
	// Is it created by the controller and will depend on the environment/secret-store:
	// https://github.com/kubernetes/kubernetes/issues/67882#issuecomment-422026204
	timeout := time.After(5 * time.Second)
	searchingForSecret := true
	for searchingForSecret {
		select {
		case <-timeout:
			return "", errors.New("unable to find secret token associated to user service account (timeout)")
		default:
			secret, err = kcl.cli.CoreV1().Secrets(portainerNamespace).Get(serviceAccountSecretName, metav1.GetOptions{})
			if err != nil {
				return "", err
			}

			if len(secret.Data) > 0 {
				searchingForSecret = false
				break
			}

			time.Sleep(1 * time.Second)
		}
	}

	secretTokenData, ok := secret.Data["token"]
	if ok {
		return string(secretTokenData), nil
	}

	return "", errors.New("unable to find secret token associated to user service account")
}
