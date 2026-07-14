package teams

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	kcli "github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func newTestTeamHandler(t *testing.T, store *datastore.Store) *Handler {
	t.Helper()
	h := NewHandler(testhelpers.NewTestRequestBouncer())
	h.DataStore = store
	return h
}

func TestTeamDelete_removesTeamFromEndpointAccessPolicies(t *testing.T) {
	t.Parallel()

	t.Run("team with no members", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, true)

		team := &portainer.Team{Name: "dev"}
		require.NoError(t, store.Team().Create(team))

		endpoint := &portainer.Endpoint{
			ID:   1,
			Name: "k8s",
			Type: portainer.AgentOnKubernetesEnvironment,
			TeamAccessPolicies: portainer.TeamAccessPolicies{
				team.ID: {RoleID: 1},
			},
		}
		require.NoError(t, store.Endpoint().Create(endpoint))

		h := newTestTeamHandler(t, store)

		req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/teams/%d", team.ID), nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		require.Equal(t, http.StatusNoContent, rr.Code)

		updated, err := store.Endpoint().Endpoint(endpoint.ID)
		require.NoError(t, err)
		_, stillPresent := updated.TeamAccessPolicies[team.ID]
		assert.False(t, stillPresent, "deleted team must be removed from endpoint TeamAccessPolicies")
	})

	t.Run("team with member has both team and user policies removed", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, true)

		team := &portainer.Team{Name: "dev"}
		require.NoError(t, store.Team().Create(team))

		user := &portainer.User{Username: "alice", Role: portainer.StandardUserRole}
		require.NoError(t, store.User().Create(user))

		require.NoError(t, store.TeamMembership().Create(&portainer.TeamMembership{
			ID: 1, UserID: user.ID, TeamID: team.ID, Role: portainer.TeamMember,
		}))

		endpoint := &portainer.Endpoint{
			ID:   1,
			Name: "k8s",
			Type: portainer.AgentOnKubernetesEnvironment,
			TeamAccessPolicies: portainer.TeamAccessPolicies{
				team.ID: {RoleID: 1},
			},
			UserAccessPolicies: portainer.UserAccessPolicies{
				user.ID: {RoleID: 1},
			},
		}
		require.NoError(t, store.Endpoint().Create(endpoint))

		h := newTestTeamHandler(t, store)

		req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/teams/%d", team.ID), nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		require.Equal(t, http.StatusNoContent, rr.Code)

		updated, err := store.Endpoint().Endpoint(endpoint.ID)
		require.NoError(t, err)

		_, teamStillPresent := updated.TeamAccessPolicies[team.ID]
		assert.False(t, teamStillPresent, "deleted team must be removed from endpoint TeamAccessPolicies")

		_, userStillPresent := updated.UserAccessPolicies[user.ID]
		assert.False(t, userStillPresent, "team member must be removed from endpoint UserAccessPolicies")
	})

	t.Run("team member in another team retains user access policy", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, true)

		deletedTeam := &portainer.Team{Name: "dev"}
		require.NoError(t, store.Team().Create(deletedTeam))

		otherTeam := &portainer.Team{Name: "ops"}
		require.NoError(t, store.Team().Create(otherTeam))

		user := &portainer.User{Username: "alice", Role: portainer.StandardUserRole}
		require.NoError(t, store.User().Create(user))

		require.NoError(t, store.TeamMembership().Create(&portainer.TeamMembership{
			ID: 1, UserID: user.ID, TeamID: deletedTeam.ID, Role: portainer.TeamMember,
		}))
		require.NoError(t, store.TeamMembership().Create(&portainer.TeamMembership{
			ID: 2, UserID: user.ID, TeamID: otherTeam.ID, Role: portainer.TeamMember,
		}))

		endpoint := &portainer.Endpoint{
			ID:   1,
			Name: "k8s",
			Type: portainer.AgentOnKubernetesEnvironment,
			TeamAccessPolicies: portainer.TeamAccessPolicies{
				deletedTeam.ID: {RoleID: 1},
				otherTeam.ID:   {RoleID: 1},
			},
			UserAccessPolicies: portainer.UserAccessPolicies{
				user.ID: {RoleID: 1},
			},
		}
		require.NoError(t, store.Endpoint().Create(endpoint))

		h := newTestTeamHandler(t, store)

		req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/teams/%d", deletedTeam.ID), nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		require.Equal(t, http.StatusNoContent, rr.Code)

		updated, err := store.Endpoint().Endpoint(endpoint.ID)
		require.NoError(t, err)

		_, deletedTeamStillPresent := updated.TeamAccessPolicies[deletedTeam.ID]
		assert.False(t, deletedTeamStillPresent, "deleted team must be removed from endpoint TeamAccessPolicies")

		_, otherTeamStillPresent := updated.TeamAccessPolicies[otherTeam.ID]
		assert.True(t, otherTeamStillPresent, "other team must remain in endpoint TeamAccessPolicies")

		_, userStillPresent := updated.UserAccessPolicies[user.ID]
		assert.True(t, userStillPresent, "team member must retain user access policy when still in another team with access")
	})
}

func TestTeamDelete_cleansUpK8sServiceAccountBindings(t *testing.T) {
	t.Parallel()

	const (
		crbName = "portainer-crb-user"
		rbName  = "portainer-rb-test-default"
	)

	t.Run("removes SA from CRB and RoleBinding when member loses all access", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, true)

		team := &portainer.Team{Name: "dev"}
		require.NoError(t, store.Team().Create(team))

		user := &portainer.User{Username: "alice", Role: portainer.StandardUserRole}
		require.NoError(t, store.User().Create(user))

		require.NoError(t, store.TeamMembership().Create(&portainer.TeamMembership{
			ID: 1, UserID: user.ID, TeamID: team.ID, Role: portainer.TeamMember,
		}))

		saName := kcli.UserServiceAccountName(int(user.ID), "test")
		subject := rbacv1.Subject{Kind: "ServiceAccount", Name: saName, Namespace: "portainer"}

		fakeK8s := kfake.NewSimpleClientset(
			&corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: saName, Namespace: "portainer"}},
			&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "default"}},
			&rbacv1.ClusterRoleBinding{
				ObjectMeta: metav1.ObjectMeta{Name: crbName},
				Subjects:   []rbacv1.Subject{subject},
				RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "portainer-cr-user"},
			},
			&rbacv1.RoleBinding{
				ObjectMeta: metav1.ObjectMeta{Name: rbName, Namespace: "default"},
				Subjects:   []rbacv1.Subject{subject},
				RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "portainer-cr-user"},
			},
		)

		endpoint := &portainer.Endpoint{
			ID:                 1,
			Type:               portainer.AgentOnKubernetesEnvironment,
			TeamAccessPolicies: portainer.TeamAccessPolicies{team.ID: {RoleID: 1}},
			UserAccessPolicies: portainer.UserAccessPolicies{},
		}
		require.NoError(t, store.Endpoint().Create(endpoint))

		h := newTestTeamHandler(t, store)
		h.K8sClientFactory = kcli.NewTestClientFactory(endpoint.ID, kcli.NewTestKubeClient(fakeK8s))

		req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/teams/%d", team.ID), nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		require.Equal(t, http.StatusNoContent, rr.Code)

		gotCRB, err := fakeK8s.RbacV1().ClusterRoleBindings().Get(t.Context(), crbName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotCRB.Subjects, "team member SA must be removed from shared CRB when team is deleted")

		gotRB, err := fakeK8s.RbacV1().RoleBindings("default").Get(t.Context(), rbName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotRB.Subjects, "team member SA must be removed from namespace RoleBinding when team is deleted")
	})

	t.Run("preserves SA bindings when member has direct endpoint access", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, true)

		team := &portainer.Team{Name: "dev"}
		require.NoError(t, store.Team().Create(team))

		user := &portainer.User{Username: "alice", Role: portainer.StandardUserRole}
		require.NoError(t, store.User().Create(user))

		require.NoError(t, store.TeamMembership().Create(&portainer.TeamMembership{
			ID: 1, UserID: user.ID, TeamID: team.ID, Role: portainer.TeamMember,
		}))

		saName := kcli.UserServiceAccountName(int(user.ID), "test")
		subject := rbacv1.Subject{Kind: "ServiceAccount", Name: saName, Namespace: "portainer"}

		fakeK8s := kfake.NewSimpleClientset(
			&corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: saName, Namespace: "portainer"}},
			&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "default"}},
			&rbacv1.ClusterRoleBinding{
				ObjectMeta: metav1.ObjectMeta{Name: crbName},
				Subjects:   []rbacv1.Subject{subject},
				RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "portainer-cr-user"},
			},
			&rbacv1.RoleBinding{
				ObjectMeta: metav1.ObjectMeta{Name: rbName, Namespace: "default"},
				Subjects:   []rbacv1.Subject{subject},
				RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "portainer-cr-user"},
			},
		)

		endpoint := &portainer.Endpoint{
			ID:                 1,
			Type:               portainer.AgentOnKubernetesEnvironment,
			TeamAccessPolicies: portainer.TeamAccessPolicies{team.ID: {RoleID: 1}},
			UserAccessPolicies: portainer.UserAccessPolicies{user.ID: {RoleID: 1}},
		}
		require.NoError(t, store.Endpoint().Create(endpoint))

		h := newTestTeamHandler(t, store)
		h.K8sClientFactory = kcli.NewTestClientFactory(endpoint.ID, kcli.NewTestKubeClient(fakeK8s))

		req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/teams/%d", team.ID), nil)
		rr := httptest.NewRecorder()
		h.ServeHTTP(rr, req)
		require.Equal(t, http.StatusNoContent, rr.Code)

		gotCRB, err := fakeK8s.RbacV1().ClusterRoleBindings().Get(t.Context(), crbName, metav1.GetOptions{})
		require.NoError(t, err)
		saInCRB := false
		for _, s := range gotCRB.Subjects {
			if s.Name == saName {
				saInCRB = true
				break
			}
		}
		assert.True(t, saInCRB, "SA must remain in CRB when member still has direct endpoint access")
	})
}

func TestTeamDelete_removesTeamFromEndpointGroupAccessPolicies(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	team := &portainer.Team{Name: "dev"}
	require.NoError(t, store.Team().Create(team))

	group := &portainer.EndpointGroup{
		Name: "prod",
		TeamAccessPolicies: portainer.TeamAccessPolicies{
			team.ID: {RoleID: 1},
		},
	}
	require.NoError(t, store.EndpointGroup().Create(group))

	h := newTestTeamHandler(t, store)

	req := httptest.NewRequest(http.MethodDelete, fmt.Sprintf("/teams/%d", team.ID), nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	require.Equal(t, http.StatusNoContent, rr.Code)

	updated, err := store.EndpointGroup().Read(group.ID)
	require.NoError(t, err)
	_, stillPresent := updated.TeamAccessPolicies[team.ID]
	assert.False(t, stillPresent, "deleted team must be removed from endpoint group TeamAccessPolicies")
}
