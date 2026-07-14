package teammemberships

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	cli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func TestDeleteTeamMembership_removesUserSABindings(t *testing.T) {
	t.Parallel()

	const (
		crbName     = "portainer-crb-user"
		rbName      = "portainer-rb-test-default"
		ns          = "default"
		teamID      = portainer.TeamID(1)
		otherSAName = "portainer-sa-user-test-99"
	)

	setupTestStore := func(t *testing.T) (*portainer.User, *portainer.Endpoint, *portainer.TeamMembership, *datastore.Store) {
		t.Helper()
		_, store := datastore.MustNewTestStore(t, true, true)

		user := &portainer.User{Username: "standard", Role: portainer.StandardUserRole}
		require.NoError(t, store.User().Create(user))

		endpoint := &portainer.Endpoint{
			Type: portainer.AgentOnKubernetesEnvironment,
			TeamAccessPolicies: portainer.TeamAccessPolicies{
				teamID: {RoleID: 1},
			},
		}
		require.NoError(t, store.Endpoint().Create(endpoint))

		membership := &portainer.TeamMembership{UserID: user.ID, TeamID: teamID, Role: portainer.TeamMember}
		require.NoError(t, store.TeamMembershipService.Create(membership))

		return user, endpoint, membership, store
	}

	deleteTeamMembership := func(t *testing.T, store *datastore.Store, endpointID portainer.EndpointID, fakeK8s *kfake.Clientset, membershipID portainer.TeamMembershipID) {
		t.Helper()
		h := NewHandler(testhelpers.NewTestRequestBouncer())
		h.DataStore = store
		h.K8sClientFactory = cli.NewTestClientFactory(endpointID, cli.NewTestKubeClient(fakeK8s))

		rr := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/team_memberships/%d", membershipID), nil)
		r = r.WithContext(security.StoreRestrictedRequestContext(r, &security.RestrictedRequestContext{IsAdmin: true}))
		h.ServeHTTP(rr, r)
		require.Equal(t, http.StatusNoContent, rr.Code)
	}

	t.Run("removes SA from RoleBinding and CRB subjects when SA is the only subject", func(t *testing.T) {
		t.Parallel()

		user, endpoint, membership, store := setupTestStore(t)

		saName := cli.UserServiceAccountName(int(user.ID), "test")
		subject := rbacv1.Subject{Kind: "ServiceAccount", Name: saName, Namespace: "portainer"}

		fakeK8s := kfake.NewSimpleClientset(
			&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: ns}},
			&rbacv1.RoleBinding{
				ObjectMeta: metav1.ObjectMeta{Name: rbName, Namespace: ns},
				Subjects:   []rbacv1.Subject{subject},
				RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "edit"},
			},
			&rbacv1.ClusterRoleBinding{
				ObjectMeta: metav1.ObjectMeta{Name: crbName},
				Subjects:   []rbacv1.Subject{subject},
				RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "cluster-admin"},
			},
		)

		deleteTeamMembership(t, store, endpoint.ID, fakeK8s, membership.ID)

		// CE updates bindings in-place; the binding remains but with the SA stripped from subjects.
		gotRB, err := fakeK8s.RbacV1().RoleBindings(ns).Get(t.Context(), rbName, metav1.GetOptions{})
		require.NoError(t, err, "RoleBinding must still exist")
		assert.Empty(t, gotRB.Subjects, "user SA must be removed from RoleBinding subjects")

		gotCRB, err := fakeK8s.RbacV1().ClusterRoleBindings().Get(t.Context(), crbName, metav1.GetOptions{})
		require.NoError(t, err, "CRB must still exist")
		assert.Empty(t, gotCRB.Subjects, "user SA must be removed from CRB subjects")
	})

	t.Run("removes SA from subjects but preserves RoleBinding and CRB when other subjects remain", func(t *testing.T) {
		t.Parallel()

		user, endpoint, membership, store := setupTestStore(t)

		saName := cli.UserServiceAccountName(int(user.ID), "test")
		subject := rbacv1.Subject{Kind: "ServiceAccount", Name: saName, Namespace: "portainer"}
		otherSubject := rbacv1.Subject{Kind: "ServiceAccount", Name: otherSAName, Namespace: "portainer"}

		fakeK8s := kfake.NewSimpleClientset(
			&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: ns}},
			&rbacv1.RoleBinding{
				ObjectMeta: metav1.ObjectMeta{Name: rbName, Namespace: ns},
				Subjects:   []rbacv1.Subject{subject, otherSubject},
				RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "edit"},
			},
			&rbacv1.ClusterRoleBinding{
				ObjectMeta: metav1.ObjectMeta{Name: crbName},
				Subjects:   []rbacv1.Subject{subject, otherSubject},
				RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "cluster-admin"},
			},
		)

		deleteTeamMembership(t, store, endpoint.ID, fakeK8s, membership.ID)

		gotRB, err := fakeK8s.RbacV1().RoleBindings(ns).Get(t.Context(), rbName, metav1.GetOptions{})
		require.NoError(t, err, "RoleBinding must be preserved when other subjects remain")
		require.Len(t, gotRB.Subjects, 1)
		assert.Equal(t, otherSAName, gotRB.Subjects[0].Name, "only the other subject must remain in RoleBinding")

		gotCRB, err := fakeK8s.RbacV1().ClusterRoleBindings().Get(t.Context(), crbName, metav1.GetOptions{})
		require.NoError(t, err, "CRB must be preserved when other subjects remain")
		require.Len(t, gotCRB.Subjects, 1)
		assert.Equal(t, otherSAName, gotCRB.Subjects[0].Name, "only the other subject must remain in CRB")
	})

	t.Run("keeps SA when user retains direct endpoint access after leaving team", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, true)

		user := &portainer.User{Username: "standard", Role: portainer.StandardUserRole}
		require.NoError(t, store.User().Create(user))

		endpoint := &portainer.Endpoint{
			Type: portainer.AgentOnKubernetesEnvironment,
			TeamAccessPolicies: portainer.TeamAccessPolicies{
				teamID: {RoleID: 1},
			},
			UserAccessPolicies: portainer.UserAccessPolicies{
				user.ID: {RoleID: 1},
			},
		}
		require.NoError(t, store.Endpoint().Create(endpoint))

		membership := &portainer.TeamMembership{UserID: user.ID, TeamID: teamID, Role: portainer.TeamMember}
		require.NoError(t, store.TeamMembershipService.Create(membership))

		saName := cli.UserServiceAccountName(int(user.ID), "test")
		subject := rbacv1.Subject{Kind: "ServiceAccount", Name: saName, Namespace: "portainer"}

		fakeK8s := kfake.NewSimpleClientset(
			&corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: saName, Namespace: "portainer"}},
			&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: ns}},
			&rbacv1.ClusterRoleBinding{
				ObjectMeta: metav1.ObjectMeta{Name: crbName},
				Subjects:   []rbacv1.Subject{subject},
				RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "portainer-cr-user"},
			},
		)

		deleteTeamMembership(t, store, endpoint.ID, fakeK8s, membership.ID)

		gotCRB, err := fakeK8s.RbacV1().ClusterRoleBindings().Get(t.Context(), crbName, metav1.GetOptions{})
		require.NoError(t, err)
		saInCRB := false
		for _, s := range gotCRB.Subjects {
			if s.Name == saName {
				saInCRB = true
				break
			}
		}
		assert.True(t, saInCRB, "SA must remain in CRB when user still has direct endpoint access")
	})
}
