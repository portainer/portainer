package users

import (
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	cli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func Test_deleteUserRemovesUserFromEndpointAccessPolicies(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	user := &portainer.User{ID: 2, Username: "standard", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(user))

	endpoint := &portainer.Endpoint{
		ID:   1,
		Name: "test-k8s",
		Type: portainer.AgentOnKubernetesEnvironment,
		UserAccessPolicies: portainer.UserAccessPolicies{
			user.ID: {RoleID: 1},
		},
	}
	require.NoError(t, store.Endpoint().Create(endpoint))

	h, _, _ := newTestHandler(t, store)

	rr := httptest.NewRecorder()
	handleErr := h.deleteUser(rr, user)
	require.Nil(t, handleErr)
	assert.Equal(t, http.StatusNoContent, rr.Code)

	updated, err := store.Endpoint().Endpoint(endpoint.ID)
	require.NoError(t, err)
	_, userStillPresent := updated.UserAccessPolicies[user.ID]
	assert.False(t, userStillPresent, "deleted user should be removed from endpoint access policies")
}

func Test_deleteUserCleansUpK8sServiceAccount(t *testing.T) {
	t.Parallel()

	const (
		crbName = "portainer-crb-user"
		rbName  = "portainer-rb-test-default"
		ns      = "default"
	)

	_, store := datastore.MustNewTestStore(t, true, true)

	user := &portainer.User{Username: "standard", Role: portainer.StandardUserRole}
	require.NoError(t, store.User().Create(user))

	endpoint := &portainer.Endpoint{Type: portainer.AgentOnKubernetesEnvironment}
	require.NoError(t, store.Endpoint().Create(endpoint))

	saName := cli.UserServiceAccountName(int(user.ID), "test")
	subject := rbacv1.Subject{Kind: "ServiceAccount", Name: saName, Namespace: "portainer"}

	fakeK8s := kfake.NewSimpleClientset(
		&corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: saName, Namespace: "portainer"}},
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: ns}},
		&rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{Name: crbName},
			Subjects:   []rbacv1.Subject{subject},
			RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "cluster-admin"},
		},
		&rbacv1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{Name: rbName, Namespace: ns},
			Subjects:   []rbacv1.Subject{subject},
			RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "edit"},
		},
	)

	h, _, _ := newTestHandler(t, store)
	h.K8sClientFactory = cli.NewTestClientFactory(endpoint.ID, cli.NewTestKubeClient(fakeK8s))

	rr := httptest.NewRecorder()
	handleErr := h.deleteUser(rr, user)
	require.Nil(t, handleErr)
	assert.Equal(t, http.StatusNoContent, rr.Code)

	_, err := fakeK8s.CoreV1().ServiceAccounts("portainer").Get(t.Context(), saName, metav1.GetOptions{})
	assert.True(t, k8serrors.IsNotFound(err), "SA object must be deleted when user is deleted")

	gotCRB, err := fakeK8s.RbacV1().ClusterRoleBindings().Get(t.Context(), crbName, metav1.GetOptions{})
	require.NoError(t, err)
	assert.Empty(t, gotCRB.Subjects, "user SA must be removed from shared CRB")

	gotRB, err := fakeK8s.RbacV1().RoleBindings(ns).Get(t.Context(), rbName, metav1.GetOptions{})
	require.NoError(t, err)
	assert.Empty(t, gotRB.Subjects, "user SA must be removed from namespace RoleBinding")
}

func Test_deleteUserRemovesAccessTokens(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	_, store := datastore.MustNewTestStore(t, true, true)

	// create standard user
	user := &portainer.User{ID: 2, Username: "standard", Role: portainer.StandardUserRole}
	err := store.User().Create(user)
	require.NoError(t, err, "error creating user")

	h, _, apiKeyService := newTestHandler(t, store)

	t.Run("standard user deletion removes all associated access tokens", func(t *testing.T) {
		_, _, err := apiKeyService.GenerateApiKey(*user, "test-user-token")
		require.NoError(t, err)

		keys, err := apiKeyService.GetAPIKeys(user.ID)
		require.NoError(t, err)
		is.Len(keys, 1)

		rr := httptest.NewRecorder()

		handleErr := h.deleteUser(rr, user)
		require.Nil(t, handleErr)

		is.Equal(http.StatusNoContent, rr.Code)

		keys, err = apiKeyService.GetAPIKeys(user.ID)
		require.NoError(t, err)
		is.Empty(keys)
	})
}
