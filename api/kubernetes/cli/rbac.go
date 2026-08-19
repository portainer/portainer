package cli

import (
	"context"
	"time"

	"github.com/portainer/portainer/api/internal/randomstring"
	"github.com/rs/zerolog/log"
	authv1 "k8s.io/api/authorization/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	authv1types "k8s.io/client-go/kubernetes/typed/authorization/v1"
	corev1types "k8s.io/client-go/kubernetes/typed/core/v1"
	rbacv1types "k8s.io/client-go/kubernetes/typed/rbac/v1"
)

const maxRetries = 5

// IsRBACEnabled checks if RBAC is enabled in the cluster by creating a service account, then checking it's access to a resourcequota before and after setting a cluster role and cluster role binding
func (kcl *KubeClient) IsRBACEnabled() (bool, error) {
	namespace := "default"
	verb := "list"
	resource := "resourcequotas"

	saClient := kcl.cli.CoreV1().ServiceAccounts(namespace)
	uniqueString := randomstring.RandomString(4) // Append a unique string to resource names, in case they already exist
	saName := "portainer-rbac-test-sa-" + uniqueString
	if err := createServiceAccount(saClient, saName, namespace); err != nil {
		log.Error().Err(err).Msg("Error creating service account")

		return false, err
	}
	defer deleteServiceAccount(saClient, saName)

	accessReviewClient := kcl.cli.AuthorizationV1().LocalSubjectAccessReviews(namespace)
	allowed, err := checkServiceAccountAccess(accessReviewClient, saName, verb, resource, namespace)
	if err != nil {
		log.Error().Err(err).Msg("Error checking service account access")

		return false, err
	}

	// If the service account with no authorizations is allowed, RBAC must be disabled
	if allowed {
		return false, nil
	}

	// Otherwise give the service account an rbac authorisation and check again
	roleClient := kcl.cli.RbacV1().Roles(namespace)
	roleName := "portainer-rbac-test-role-" + uniqueString
	if err := createRole(roleClient, roleName, verb, resource, namespace); err != nil {
		log.Error().Err(err).Msg("Error creating role")

		return false, err
	}
	defer deleteRole(roleClient, roleName)

	roleBindingClient := kcl.cli.RbacV1().RoleBindings(namespace)
	roleBindingName := "portainer-rbac-test-role-binding-" + uniqueString
	if err := createRoleBinding(roleBindingClient, roleBindingName, roleName, saName, namespace); err != nil {
		log.Error().Err(err).Msg("Error creating role binding")

		return false, err
	}
	defer deleteRoleBinding(roleBindingClient, roleBindingName)

	allowed, err = checkServiceAccountAccess(accessReviewClient, saName, verb, resource, namespace)
	if err != nil {
		log.Error().Err(err).Msg("Error checking service account access with authorizations added")

		return false, err
	}

	// If the service account allowed to list resource quotas after given rbac role, then RBAC is enabled
	return allowed, nil
}

func createServiceAccount(saClient corev1types.ServiceAccountInterface, name string, namespace string) error {
	serviceAccount := &corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
	}

	_, err := saClient.Create(context.Background(), serviceAccount, metav1.CreateOptions{})

	return err
}

func deleteServiceAccount(saClient corev1types.ServiceAccountInterface, name string) {
	if err := saClient.Delete(context.Background(), name, metav1.DeleteOptions{}); err != nil {
		log.Error().Err(err).Msg("Error deleting service account: " + name)
	}
}

func createRole(roleClient rbacv1types.RoleInterface, name string, verb string, resource string, namespace string) error {
	role := &rbacv1.Role{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
		},
		Rules: []rbacv1.PolicyRule{
			{
				APIGroups: []string{""},
				Verbs:     []string{verb},
				Resources: []string{resource},
			},
		},
	}

	_, err := roleClient.Create(context.Background(), role, metav1.CreateOptions{})

	return err
}

func deleteRole(roleClient rbacv1types.RoleInterface, name string) {
	if err := roleClient.Delete(context.Background(), name, metav1.DeleteOptions{}); err != nil {
		log.Error().Err(err).Msg("Error deleting role: " + name)
	}
}

func createRoleBinding(roleBindingClient rbacv1types.RoleBindingInterface, clusterRoleBindingName string, roleName string, serviceAccountName string, namespace string) error {
	clusterRoleBinding := &rbacv1.RoleBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name: clusterRoleBindingName,
		},
		Subjects: []rbacv1.Subject{
			{
				Kind:      "ServiceAccount",
				Name:      serviceAccountName,
				Namespace: namespace,
			},
		},
		RoleRef: rbacv1.RoleRef{
			Kind:     "Role",
			Name:     roleName,
			APIGroup: "rbac.authorization.k8s.io",
		},
	}

	roleBinding, err := roleBindingClient.Create(context.Background(), clusterRoleBinding, metav1.CreateOptions{})
	if err != nil {
		log.Error().Err(err).Msg("Error creating role binding: " + clusterRoleBindingName)

		return err
	}

	// Retry checkRoleBinding a maximum of 5 times with a 100ms wait after each attempt
	for range maxRetries {
		err = checkRoleBinding(roleBindingClient, roleBinding.Name)

		time.Sleep(100 * time.Millisecond) // Wait for 100ms, even if the check passes

		if err == nil {
			break
		}
	}

	return err
}

func checkRoleBinding(roleBindingClient rbacv1types.RoleBindingInterface, name string) error {
	if _, err := roleBindingClient.Get(context.Background(), name, metav1.GetOptions{}); err != nil {
		log.Error().Err(err).Msg("Error finding rolebinding: " + name)

		return err
	}

	return nil
}

func deleteRoleBinding(roleBindingClient rbacv1types.RoleBindingInterface, name string) {
	if err := roleBindingClient.Delete(context.Background(), name, metav1.DeleteOptions{}); err != nil {
		log.Error().Err(err).Msg("Error deleting role binding: " + name)
	}
}

func checkServiceAccountAccess(accessReviewClient authv1types.LocalSubjectAccessReviewInterface, serviceAccountName string, verb string, resource string, namespace string) (bool, error) {
	subjectAccessReview := &authv1.LocalSubjectAccessReview{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: namespace,
		},
		Spec: authv1.SubjectAccessReviewSpec{
			ResourceAttributes: &authv1.ResourceAttributes{
				Namespace: namespace,
				Verb:      verb,
				Resource:  resource,
			},
			User: "system:serviceaccount:default:" + serviceAccountName, // a workaround to be able to use the service account as a user
		},
	}

	result, err := accessReviewClient.Create(context.Background(), subjectAccessReview, metav1.CreateOptions{})
	if err != nil {
		return false, err
	}

	return result.Status.Allowed, nil
}
