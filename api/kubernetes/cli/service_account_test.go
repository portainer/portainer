package cli

import (
	"context"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	v1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func Test_GetServiceAccount(t *testing.T) {

	t.Run("returns error if non-existent", func(t *testing.T) {
		k := &KubeClient{
			cli:        kfake.NewSimpleClientset(),
			instanceID: "test",
		}
		tokenData := &portainer.TokenData{ID: 1}
		_, err := k.GetPortainerUserServiceAccount(tokenData)
		if err == nil {
			t.Error("GetPortainerUserServiceAccount should fail with service account not found")
		}
	})

	t.Run("succeeds for cluster admin role", func(t *testing.T) {
		k := &KubeClient{
			cli:        kfake.NewSimpleClientset(),
			instanceID: "test",
		}

		tokenData := &portainer.TokenData{
			ID:       1,
			Role:     portainer.AdministratorRole,
			Username: portainerClusterAdminServiceAccountName,
		}
		serviceAccount := &v1.ServiceAccount{
			ObjectMeta: metav1.ObjectMeta{
				Name: tokenData.Username,
			},
		}
		_, err := k.cli.CoreV1().ServiceAccounts(portainerNamespace).Create(context.Background(), serviceAccount, metav1.CreateOptions{})
		if err != nil {
			t.Errorf("failed to create service acount; err=%s", err)
		}
		defer func() {
			err := k.cli.CoreV1().ServiceAccounts(portainerNamespace).Delete(context.Background(), serviceAccount.Name, metav1.DeleteOptions{})
			require.NoError(t, err)
		}()

		sa, err := k.GetPortainerUserServiceAccount(tokenData)
		if err != nil {
			t.Errorf("GetPortainerUserServiceAccount should succeed; err=%s", err)
		}

		want := "portainer-sa-clusteradmin"
		if sa.Name != want {
			t.Errorf("GetServiceAccount should succeed and return correct sa name; got=%s want=%s", sa.Name, want)
		}
	})

	t.Run("succeeds for standard user role", func(t *testing.T) {
		k := &KubeClient{
			cli:        kfake.NewSimpleClientset(),
			instanceID: "test",
		}

		tokenData := &portainer.TokenData{
			ID:   1,
			Role: portainer.StandardUserRole,
		}
		serviceAccountName := UserServiceAccountName(int(tokenData.ID), k.instanceID)
		serviceAccount := &v1.ServiceAccount{
			ObjectMeta: metav1.ObjectMeta{
				Name: serviceAccountName,
			},
		}
		_, err := k.cli.CoreV1().ServiceAccounts(portainerNamespace).Create(context.Background(), serviceAccount, metav1.CreateOptions{})
		if err != nil {
			t.Errorf("failed to create service acount; err=%s", err)
		}
		defer func() {
			err := k.cli.CoreV1().ServiceAccounts(portainerNamespace).Delete(context.Background(), serviceAccount.Name, metav1.DeleteOptions{})
			require.NoError(t, err)
		}()

		sa, err := k.GetPortainerUserServiceAccount(tokenData)
		if err != nil {
			t.Errorf("GetPortainerUserServiceAccount should succeed; err=%s", err)
		}

		want := "portainer-sa-user-test-1"
		if sa.Name != want {
			t.Errorf("GetPortainerUserServiceAccount should succeed and return correct sa name; got=%s want=%s", sa.Name, want)
		}
	})

}

func TestRemoveServiceAccountFromUserClusterRoleBinding(t *testing.T) {
	t.Parallel()

	saName := UserServiceAccountName(1, "test")
	subject := rbacv1.Subject{Kind: "ServiceAccount", Name: saName, Namespace: portainerNamespace}

	t.Run("removes SA from CRB when it is the only subject", func(t *testing.T) {
		t.Parallel()

		crb := &rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{Name: portainerUserCRBName},
			Subjects:   []rbacv1.Subject{subject},
			RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: portainerUserCRName},
		}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(crb), instanceID: "test"}

		require.NoError(t, kcl.removeServiceAccountFromUserClusterRoleBinding(saName))

		got, err := kcl.cli.RbacV1().ClusterRoleBindings().Get(t.Context(), portainerUserCRBName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, got.Subjects)
	})

	t.Run("preserves other subjects when removing target SA", func(t *testing.T) {
		t.Parallel()

		otherSAName := UserServiceAccountName(2, "test")
		otherSubject := rbacv1.Subject{Kind: "ServiceAccount", Name: otherSAName, Namespace: portainerNamespace}
		crb := &rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{Name: portainerUserCRBName},
			Subjects:   []rbacv1.Subject{subject, otherSubject},
			RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: portainerUserCRName},
		}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(crb), instanceID: "test"}

		require.NoError(t, kcl.removeServiceAccountFromUserClusterRoleBinding(saName))

		got, err := kcl.cli.RbacV1().ClusterRoleBindings().Get(t.Context(), portainerUserCRBName, metav1.GetOptions{})
		require.NoError(t, err)
		require.Len(t, got.Subjects, 1)
		assert.Equal(t, otherSAName, got.Subjects[0].Name)
	})

	t.Run("is a no-op when CRB does not exist", func(t *testing.T) {
		t.Parallel()

		kcl := &KubeClient{cli: kfake.NewSimpleClientset(), instanceID: "test"}
		require.NoError(t, kcl.removeServiceAccountFromUserClusterRoleBinding(saName))
	})
}

func TestRemoveUserServiceAccountBindings(t *testing.T) {
	t.Parallel()

	const (
		userID    = 1
		namespace = "default"
	)

	saName := UserServiceAccountName(userID, "test")
	rbName := namespaceClusterRoleBindingName(namespace, "test")
	subject := rbacv1.Subject{Kind: "ServiceAccount", Name: saName, Namespace: portainerNamespace}

	t.Run("removes SA from namespace RoleBinding and shared CRB but keeps SA object", func(t *testing.T) {
		t.Parallel()

		sa := &v1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: saName, Namespace: portainerNamespace}}
		ns := &v1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: namespace}}
		crb := &rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{Name: portainerUserCRBName},
			Subjects:   []rbacv1.Subject{subject},
			RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: portainerUserCRName},
		}
		rb := &rbacv1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{Name: rbName, Namespace: namespace},
			Subjects:   []rbacv1.Subject{subject},
			RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "edit"},
		}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(sa, ns, crb, rb), instanceID: "test"}

		require.NoError(t, kcl.RemoveUserServiceAccountBindings(userID))

		_, err := kcl.cli.CoreV1().ServiceAccounts(portainerNamespace).Get(t.Context(), saName, metav1.GetOptions{})
		require.NoError(t, err, "SA object must not be deleted on access revocation")

		gotCRB, err := kcl.cli.RbacV1().ClusterRoleBindings().Get(t.Context(), portainerUserCRBName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotCRB.Subjects, "SA must be removed from shared CRB")

		gotRB, err := kcl.cli.RbacV1().RoleBindings(namespace).Get(t.Context(), rbName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotRB.Subjects, "SA must be removed from namespace RoleBinding")
	})

	t.Run("preserves other users subjects when removing one user", func(t *testing.T) {
		t.Parallel()

		otherSAName := UserServiceAccountName(2, "test")
		otherSubject := rbacv1.Subject{Kind: "ServiceAccount", Name: otherSAName, Namespace: portainerNamespace}

		ns := &v1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: namespace}}
		crb := &rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{Name: portainerUserCRBName},
			Subjects:   []rbacv1.Subject{subject, otherSubject},
			RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: portainerUserCRName},
		}
		rb := &rbacv1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{Name: rbName, Namespace: namespace},
			Subjects:   []rbacv1.Subject{subject, otherSubject},
			RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "edit"},
		}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(ns, crb, rb), instanceID: "test"}

		require.NoError(t, kcl.RemoveUserServiceAccountBindings(userID))

		gotCRB, err := kcl.cli.RbacV1().ClusterRoleBindings().Get(t.Context(), portainerUserCRBName, metav1.GetOptions{})
		require.NoError(t, err)
		require.Len(t, gotCRB.Subjects, 1)
		assert.Equal(t, otherSAName, gotCRB.Subjects[0].Name)

		gotRB, err := kcl.cli.RbacV1().RoleBindings(namespace).Get(t.Context(), rbName, metav1.GetOptions{})
		require.NoError(t, err)
		require.Len(t, gotRB.Subjects, 1)
		assert.Equal(t, otherSAName, gotRB.Subjects[0].Name)
	})

}

func TestRemoveUserServiceAccount(t *testing.T) {
	t.Parallel()

	const (
		userID    = 1
		namespace = "default"
	)

	saName := UserServiceAccountName(userID, "test")
	rbName := namespaceClusterRoleBindingName(namespace, "test")
	subject := rbacv1.Subject{Kind: "ServiceAccount", Name: saName, Namespace: portainerNamespace}

	t.Run("deletes SA object and removes it from all bindings", func(t *testing.T) {
		t.Parallel()

		sa := &v1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: saName, Namespace: portainerNamespace}}
		ns := &v1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: namespace}}
		crb := &rbacv1.ClusterRoleBinding{
			ObjectMeta: metav1.ObjectMeta{Name: portainerUserCRBName},
			Subjects:   []rbacv1.Subject{subject},
			RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: portainerUserCRName},
		}
		rb := &rbacv1.RoleBinding{
			ObjectMeta: metav1.ObjectMeta{Name: rbName, Namespace: namespace},
			Subjects:   []rbacv1.Subject{subject},
			RoleRef:    rbacv1.RoleRef{Kind: "ClusterRole", Name: "edit"},
		}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(sa, ns, crb, rb), instanceID: "test"}

		require.NoError(t, kcl.RemoveUserServiceAccount(userID))

		_, err := kcl.cli.CoreV1().ServiceAccounts(portainerNamespace).Get(t.Context(), saName, metav1.GetOptions{})
		assert.True(t, k8serrors.IsNotFound(err), "SA object must be deleted on user deletion")

		gotCRB, err := kcl.cli.RbacV1().ClusterRoleBindings().Get(t.Context(), portainerUserCRBName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotCRB.Subjects, "SA must be removed from shared CRB")

		gotRB, err := kcl.cli.RbacV1().RoleBindings(namespace).Get(t.Context(), rbName, metav1.GetOptions{})
		require.NoError(t, err)
		assert.Empty(t, gotRB.Subjects, "SA must be removed from namespace RoleBinding")
	})

	t.Run("is idempotent when SA does not exist", func(t *testing.T) {
		t.Parallel()

		ns := &v1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: namespace}}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(ns), instanceID: "test"}

		require.NoError(t, kcl.RemoveUserServiceAccount(userID))
	})
}
