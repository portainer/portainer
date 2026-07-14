package endpoints

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	kcli "github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func TestReconcileK8sServiceAccounts(t *testing.T) {
	t.Parallel()

	const (
		userID  = portainer.UserID(1)
		crbName = "portainer-crb-user"
		rbName  = "portainer-rb-test-default"
	)
	saName := kcli.UserServiceAccountName(int(userID), "test")
	saSubject := rbacv1.Subject{Kind: "ServiceAccount", Name: saName, Namespace: "portainer"}

	existingBindingsWithUser := func() *kfake.Clientset {
		return kfake.NewSimpleClientset(
			&corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: saName, Namespace: "portainer"}},
			&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "default"}},
			&rbacv1.ClusterRoleBinding{
				ObjectMeta: metav1.ObjectMeta{Name: crbName},
				Subjects:   []rbacv1.Subject{saSubject},
				RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "portainer-cr-user"},
			},
			&rbacv1.RoleBinding{
				ObjectMeta: metav1.ObjectMeta{Name: rbName, Namespace: "default"},
				Subjects:   []rbacv1.Subject{saSubject},
				RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "portainer-cr-user"},
			},
		)
	}

	saInCRB := func(t *testing.T, fakeK8s *kfake.Clientset) bool {
		t.Helper()
		crb, err := fakeK8s.RbacV1().ClusterRoleBindings().Get(t.Context(), crbName, metav1.GetOptions{})
		require.NoError(t, err)
		for _, s := range crb.Subjects {
			if s.Name == saName {
				return true
			}
		}
		return false
	}

	saInRB := func(t *testing.T, fakeK8s *kfake.Clientset) bool {
		t.Helper()
		rb, err := fakeK8s.RbacV1().RoleBindings("default").Get(t.Context(), rbName, metav1.GetOptions{})
		require.NoError(t, err)
		for _, s := range rb.Subjects {
			if s.Name == saName {
				return true
			}
		}
		return false
	}

	t.Run("removes bindings when user's only direct access is removed", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, true)
		fakeK8s := existingBindingsWithUser()

		endpoint := &portainer.Endpoint{
			ID:                 1,
			Type:               portainer.AgentOnKubernetesEnvironment,
			UserAccessPolicies: portainer.UserAccessPolicies{},
			TeamAccessPolicies: portainer.TeamAccessPolicies{},
		}
		h := &Handler{
			DataStore:        store,
			K8sClientFactory: kcli.NewTestClientFactory(endpoint.ID, kcli.NewTestKubeClient(fakeK8s)),
		}

		h.reconcileK8sServiceAccounts(endpoint,
			portainer.UserAccessPolicies{userID: {RoleID: 1}},
			portainer.TeamAccessPolicies{},
		)

		gotCRB, err := fakeK8s.RbacV1().ClusterRoleBindings().Get(t.Context(), crbName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotCRB.Subjects, "SA must be removed from CRB when user's only direct access is revoked")

		gotRB, err := fakeK8s.RbacV1().RoleBindings("default").Get(t.Context(), rbName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotRB.Subjects, "SA must be removed from namespace RoleBinding when user's only direct access is revoked")
	})

	t.Run("removes bindings when both direct and team access are removed", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, true)

		const teamID = portainer.TeamID(1)
		require.NoError(t, store.TeamMembership().Create(&portainer.TeamMembership{
			ID: 1, UserID: userID, TeamID: teamID, Role: portainer.TeamMember,
		}))

		fakeK8s := existingBindingsWithUser()

		endpoint := &portainer.Endpoint{
			ID:                 1,
			Type:               portainer.AgentOnKubernetesEnvironment,
			UserAccessPolicies: portainer.UserAccessPolicies{},
			TeamAccessPolicies: portainer.TeamAccessPolicies{},
		}
		h := &Handler{
			DataStore:        store,
			K8sClientFactory: kcli.NewTestClientFactory(endpoint.ID, kcli.NewTestKubeClient(fakeK8s)),
		}

		h.reconcileK8sServiceAccounts(endpoint,
			portainer.UserAccessPolicies{userID: {RoleID: 1}},
			portainer.TeamAccessPolicies{teamID: {RoleID: 1}},
		)

		gotCRB, err := fakeK8s.RbacV1().ClusterRoleBindings().Get(t.Context(), crbName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotCRB.Subjects, "SA must be removed from CRB when all access is revoked")

		gotRB, err := fakeK8s.RbacV1().RoleBindings("default").Get(t.Context(), rbName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotRB.Subjects, "SA must be removed from namespace RoleBinding when all access is revoked")
	})

	t.Run("removes bindings when team access is removed", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, true)

		const teamID = portainer.TeamID(1)
		require.NoError(t, store.TeamMembership().Create(&portainer.TeamMembership{
			ID: 1, UserID: userID, TeamID: teamID, Role: portainer.TeamMember,
		}))

		fakeK8s := existingBindingsWithUser()

		endpoint := &portainer.Endpoint{
			ID:                 1,
			Type:               portainer.AgentOnKubernetesEnvironment,
			UserAccessPolicies: portainer.UserAccessPolicies{},
			TeamAccessPolicies: portainer.TeamAccessPolicies{},
		}
		h := &Handler{
			DataStore:        store,
			K8sClientFactory: kcli.NewTestClientFactory(endpoint.ID, kcli.NewTestKubeClient(fakeK8s)),
		}

		h.reconcileK8sServiceAccounts(endpoint,
			portainer.UserAccessPolicies{},
			portainer.TeamAccessPolicies{teamID: {RoleID: 1}},
		)

		gotCRB, err := fakeK8s.RbacV1().ClusterRoleBindings().Get(t.Context(), crbName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotCRB.Subjects, "SA must be removed from CRB when team loses access")

		gotRB, err := fakeK8s.RbacV1().RoleBindings("default").Get(t.Context(), rbName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotRB.Subjects, "SA must be removed from namespace RoleBinding when team loses access")
	})

	t.Run("keeps SA when team loses access but user is in another team with access", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, true)

		const (
			removedTeamID  = portainer.TeamID(1)
			retainedTeamID = portainer.TeamID(2)
		)
		require.NoError(t, store.TeamMembership().Create(&portainer.TeamMembership{
			ID: 1, UserID: userID, TeamID: removedTeamID, Role: portainer.TeamMember,
		}))
		require.NoError(t, store.TeamMembership().Create(&portainer.TeamMembership{
			ID: 2, UserID: userID, TeamID: retainedTeamID, Role: portainer.TeamMember,
		}))

		fakeK8s := kfake.NewSimpleClientset(
			&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "default"}},
		)

		endpoint := &portainer.Endpoint{
			ID:                 1,
			Type:               portainer.AgentOnKubernetesEnvironment,
			UserAccessPolicies: portainer.UserAccessPolicies{},
			TeamAccessPolicies: portainer.TeamAccessPolicies{retainedTeamID: {RoleID: 1}},
		}
		h := &Handler{
			DataStore:        store,
			K8sClientFactory: kcli.NewTestClientFactory(endpoint.ID, kcli.NewTestKubeClient(fakeK8s)),
		}

		h.reconcileK8sServiceAccounts(endpoint,
			portainer.UserAccessPolicies{},
			portainer.TeamAccessPolicies{removedTeamID: {RoleID: 1}},
		)

		assert.True(t, saInCRB(t, fakeK8s), "SA must remain in CRB when user still has access via another team")
		assert.True(t, saInRB(t, fakeK8s), "SA must remain in namespace RoleBinding when user still has access via another team")
	})

	t.Run("keeps SA when direct access is removed but team access remains", func(t *testing.T) {
		t.Parallel()

		_, store := datastore.MustNewTestStore(t, true, true)

		const teamID = portainer.TeamID(1)
		require.NoError(t, store.TeamMembership().Create(&portainer.TeamMembership{
			ID: 1, UserID: userID, TeamID: teamID, Role: portainer.TeamMember,
		}))

		fakeK8s := kfake.NewSimpleClientset(
			&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "default"}},
		)

		endpoint := &portainer.Endpoint{
			ID:                 1,
			Type:               portainer.AgentOnKubernetesEnvironment,
			UserAccessPolicies: portainer.UserAccessPolicies{},
			TeamAccessPolicies: portainer.TeamAccessPolicies{teamID: {RoleID: 1}},
		}
		h := &Handler{
			DataStore:        store,
			K8sClientFactory: kcli.NewTestClientFactory(endpoint.ID, kcli.NewTestKubeClient(fakeK8s)),
		}

		h.reconcileK8sServiceAccounts(endpoint,
			portainer.UserAccessPolicies{userID: {RoleID: 1}},
			portainer.TeamAccessPolicies{},
		)

		assert.True(t, saInCRB(t, fakeK8s), "SA must remain in CRB when team still grants access")
		assert.True(t, saInRB(t, fakeK8s), "SA must remain in namespace RoleBinding when team still grants access")
	})
}

func Test_endpointPut_TLSRejectedForEdgeEndpoint(t *testing.T) {
	t.Parallel()

	_, store := datastore.MustNewTestStore(t, true, true)

	h := NewHandler(testhelpers.NewTestRequestBouncer())
	h.DataStore = store

	testCases := []struct {
		name         string
		endpointType portainer.EndpointType
	}{
		{
			name:         "edge agent on docker rejects TLS",
			endpointType: portainer.EdgeAgentOnDockerEnvironment,
		},
		{
			name:         "edge agent on kubernetes rejects TLS",
			endpointType: portainer.EdgeAgentOnKubernetesEnvironment,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			endpointID := portainer.EndpointID(store.Endpoint().GetNextIdentifier())
			err := store.Endpoint().Create(&portainer.Endpoint{
				ID:   endpointID,
				Type: tc.endpointType,
			})
			require.NoError(t, err)

			payload := &endpointUpdatePayload{TLS: new(true)}
			bodyJSON, err := json.Marshal(payload)
			require.NoError(t, err)

			url := fmt.Sprintf("/endpoints/%d", endpointID)
			req := httptest.NewRequest(http.MethodPut, url, bytes.NewBuffer(bodyJSON))
			rctx := security.StoreTokenData(req, &portainer.TokenData{ID: 1, Username: "admin", Role: portainer.AdministratorRole})
			req = req.WithContext(rctx)
			req.Header.Set("Content-Type", "application/json")

			rr := httptest.NewRecorder()
			h.ServeHTTP(rr, req)

			assert.Equal(t, http.StatusBadRequest, rr.Code)
		})
	}
}
