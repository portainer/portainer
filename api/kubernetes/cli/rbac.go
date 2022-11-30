package cli

import (
	"context"

	"github.com/gofrs/uuid"
	"github.com/rs/zerolog/log"
	authv1 "k8s.io/api/authorization/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	authv1types "k8s.io/client-go/kubernetes/typed/authorization/v1"
	corev1types "k8s.io/client-go/kubernetes/typed/core/v1"
	rbacv1types "k8s.io/client-go/kubernetes/typed/rbac/v1"
)

// IsRBACEnabled checks if RBAC is enabled in the cluster by creating a service account, then checking it's access to a resourcequota before and after setting a cluster role and cluster role binding
func (kcl *KubeClient) IsRBACEnabled() (bool, error) {
	saClient := kcl.cli.CoreV1().ServiceAccounts("default")
	uniqueString := randomString() // append a unique string to resource names, incase they already exist
	saName := "portainer-rbac-test-sa-" + uniqueString

	err := createServiceAccount(saClient, saName)
	if err != nil {
		log.Error().Err(err).Msg("Error creating service account")
		return false, err
	}
	defer deleteServiceAccount(saClient, saName)

	accessReviewClient := kcl.cli.AuthorizationV1().LocalSubjectAccessReviews("default")
	verb := "list"
	resource := "resourcequotas"
	allowed, err := checkServiceAccountAccess(accessReviewClient, saName, verb, resource)
	if err != nil {
		log.Error().Err(err).Msg("Error checking service account access")
		return false, err
	}

	// if the service account with no authorizations is allowed, RBAC must be disabled
	if allowed {
		return false, nil
	}

	// otherwise give the service account an rbac authorisation and check again
	crClient := kcl.cli.RbacV1().ClusterRoles()
	crName := "portainer-rbac-test-cluster-role-" + uniqueString
	err = createClusterRole(crClient, crName, "list", "resourcequotas")
	if err != nil {
		log.Error().Err(err).Msg("Error creating cluster role")
		return false, err
	}
	defer deleteClusterRole(crClient, crName)

	crbClient := kcl.cli.RbacV1().ClusterRoleBindings()
	crbName := "portainer-rbac-test-cluster-role-binding-" + uniqueString
	err = createClusterRoleBinding(crbClient, crbName, crName, saName)
	if err != nil {
		log.Error().Err(err).Msg("Error creating cluster role binding")
		return false, err
	}
	defer deleteClusterRoleBinding(crbClient, crbName)

	allowed, err = checkServiceAccountAccess(accessReviewClient, saName, verb, resource)
	if err != nil {
		log.Error().Err(err).Msg("Error checking service account access with authorizations added")
		return false, err
	}

	// if the service account allowed to list resource quotas after given rbac cluster role, then RBAC is enabled
	if allowed {
		return true, nil
	}

	return false, nil
}

func createServiceAccount(saClient corev1types.ServiceAccountInterface, name string) error {
	serviceAccount := &corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: "default",
		},
	}
	_, err := saClient.Create(context.Background(), serviceAccount, metav1.CreateOptions{})
	return err
}

func deleteServiceAccount(saClient corev1types.ServiceAccountInterface, name string) error {
	err := saClient.Delete(context.Background(), name, metav1.DeleteOptions{})
	return err
}

func createClusterRole(crClient rbacv1types.ClusterRoleInterface, name string, verb string, resource string) error {
	clusterRole := &rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
		},
		Rules: []rbacv1.PolicyRule{
			{
				APIGroups: []string{""},
				Verbs:     []string{verb},
				Resources: []string{resource},
			},
		},
	}
	_, err := crClient.Create(context.Background(), clusterRole, metav1.CreateOptions{})
	return err
}

func deleteClusterRole(crClient rbacv1types.ClusterRoleInterface, name string) error {
	err := crClient.Delete(context.Background(), name, metav1.DeleteOptions{})
	return err
}

func createClusterRoleBinding(crbClient rbacv1types.ClusterRoleBindingInterface, clusterRoleBindingName string, clusterRoleName string, serviceAccountName string) error {
	clusterRoleBinding := &rbacv1.ClusterRoleBinding{
		ObjectMeta: metav1.ObjectMeta{
			Name: clusterRoleBindingName,
		},
		Subjects: []rbacv1.Subject{
			{
				Kind:      "ServiceAccount",
				Name:      serviceAccountName,
				Namespace: "default",
			},
		},
		RoleRef: rbacv1.RoleRef{
			Kind:     "ClusterRole",
			Name:     clusterRoleName,
			APIGroup: "rbac.authorization.k8s.io",
		},
	}
	_, err := crbClient.Create(context.Background(), clusterRoleBinding, metav1.CreateOptions{})
	return err
}

func deleteClusterRoleBinding(crbClient rbacv1types.ClusterRoleBindingInterface, name string) error {
	err := crbClient.Delete(context.Background(), name, metav1.DeleteOptions{})
	return err
}

func checkServiceAccountAccess(accessReviewClient authv1types.LocalSubjectAccessReviewInterface, serviceAccountName string, verb string, resource string) (bool, error) {
	subjectAccessReview := &authv1.LocalSubjectAccessReview{
		ObjectMeta: metav1.ObjectMeta{
			Namespace: "default",
		},
		Spec: authv1.SubjectAccessReviewSpec{
			ResourceAttributes: &authv1.ResourceAttributes{
				Namespace: "default",
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

func randomString() string {
	s, _ := uuid.NewV4()
	return s.String()[:5]
}
