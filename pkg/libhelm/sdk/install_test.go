package sdk

import (
	"os"
	"testing"
	"time"

	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/portainer/portainer/pkg/libhelm/test"

	"encoding/json"
	"errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"helm.sh/helm/v4/pkg/action"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes/fake"
	k8stesting "k8s.io/client-go/testing"
	"net/http"
	"net/http/httptest"
)

func Test_Install(t *testing.T) {
	t.Parallel()
	test.EnsureIntegrationTest(t)
	is := require.New(t)

	// Create a new SDK package manager
	hspm := NewHelmSDKPackageManager()

	t.Run("successfully installs nginx chart with name test-nginx", func(t *testing.T) {
		// SDK equivalent of: helm install test-nginx --repo https://kubernetes.github.io/ingress-nginx nginx
		installOpts := options.InstallOptions{
			Name:  "test-nginx",
			Chart: "ingress-nginx",
			Repo:  "https://kubernetes.github.io/ingress-nginx",
		}

		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		is.Equal("test-nginx", release.Name, "release name should match")
		is.Equal(1, release.Version, "release version should be 1")
		is.NotEmpty(release.Manifest, "release manifest should not be empty")
	})

	t.Run("successfully installs nginx with values", func(t *testing.T) {
		// SDK equivalent of: helm install test-nginx-2 --repo https://kubernetes.github.io/ingress-nginx nginx --values /tmp/helm-values3161785816
		values, err := test.CreateValuesFile("service:\n  port:  8081")
		require.NoError(t, err, "should create a values file")
		defer func() {
			err := os.Remove(values)
			require.NoError(t, err)
		}()

		installOpts := options.InstallOptions{
			Name:       "test-nginx-2",
			Chart:      "ingress-nginx",
			Repo:       "https://kubernetes.github.io/ingress-nginx",
			ValuesFile: values,
		}

		err = hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		is.Equal("test-nginx-2", release.Name, "release name should match")
		is.Equal(1, release.Version, "release version should be 1")
		is.NotEmpty(release.Manifest, "release manifest should not be empty")
	})

	t.Run("successfully installs portainer chart with name portainer-test", func(t *testing.T) {
		// SDK equivalent of: helm install portainer-test portainer --repo https://portainer.github.io/k8s/
		installOpts := options.InstallOptions{
			Name:  "portainer-test",
			Chart: "portainer",
			Repo:  "https://portainer.github.io/k8s/",
		}

		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		is.Equal("portainer-test", release.Name, "release name should match")
		is.Equal(1, release.Version, "release version should be 1")
		is.NotEmpty(release.Manifest, "release manifest should not be empty")
	})

	t.Run("install with values as string", func(t *testing.T) {
		// First create a values file since InstallOptions doesn't support values as string directly
		values, err := test.CreateValuesFile("service:\n  port:  8082")
		require.NoError(t, err, "should create a values file")
		defer func() {
			err := os.Remove(values)
			require.NoError(t, err)
		}()

		// Install with values file
		installOpts := options.InstallOptions{
			Name:       "test-nginx-3",
			Chart:      "ingress-nginx",
			Repo:       "https://kubernetes.github.io/ingress-nginx",
			ValuesFile: values,
		}

		err = hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		is.Equal("test-nginx-3", release.Name, "release name should match")
	})

	t.Run("install with namespace", func(t *testing.T) {
		// Install with namespace
		installOpts := options.InstallOptions{
			Name:      "test-nginx-4",
			Chart:     "ingress-nginx",
			Repo:      "https://kubernetes.github.io/ingress-nginx",
			Namespace: "default",
		}

		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		release, err := hspm.Upgrade(installOpts)
		require.NoError(t, err, "should successfully install release")
		is.NotNil(release, "should return non-nil release")
		defer func() {
			err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
			require.NoError(t, err)
		}()

		is.Equal("test-nginx-4", release.Name, "release name should match")
		is.Equal("default", release.Namespace, "release namespace should match")
	})

	t.Run("returns an error when name is not provided", func(t *testing.T) {
		installOpts := options.InstallOptions{
			Chart: "ingress-nginx",
			Repo:  "https://kubernetes.github.io/ingress-nginx",
		}

		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		_, err = hspm.Upgrade(installOpts)

		require.Error(t, err, "should return an error when name is not provided")
		// is.Equal(err.Error(), "name is required for helm release installation")
	})

	t.Run("install with invalid chart", func(t *testing.T) {
		// Install with invalid chart
		installOpts := options.InstallOptions{
			Name:  "test-invalid",
			Chart: "non-existent-chart",
			Repo:  "https://kubernetes.github.io/ingress-nginx",
		}
		_, err := hspm.Upgrade(installOpts)
		require.Error(t, err, "should return error when chart doesn't exist")
	})

	t.Run("install with invalid repo", func(t *testing.T) {
		// Install with invalid repo
		installOpts := options.InstallOptions{
			Name:  "test-invalid-repo",
			Chart: "nginx",
			Repo:  "https://non-existent-repo.example.com",
		}

		err := hspm.Uninstall(options.UninstallOptions{Name: installOpts.Name})
		require.NoError(t, err)

		_, err = hspm.Upgrade(installOpts)
		require.Error(t, err, "should return error when repo doesn't exist")
	})
}

func Test_releaseTimeout(t *testing.T) {
	t.Parallel()

	requestedTimeout := 2 * time.Minute

	tests := []struct {
		name              string
		requested         time.Duration
		rollbackOnFailure bool
		want              time.Duration
	}{
		{name: "defaults when no timeout is requested", want: defaultReleaseTimeout},
		{name: "defaults longer for rollback on failure", rollbackOnFailure: true, want: defaultAtomicReleaseTimeout},
		{name: "uses the requested timeout", requested: requestedTimeout, want: requestedTimeout},
		{name: "uses the requested timeout for rollback on failure", requested: requestedTimeout, rollbackOnFailure: true, want: requestedTimeout},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			require.Equal(t, tt.want, releaseTimeout(tt.requested, tt.rollbackOnFailure))
		})
	}
}

func Test_initInstallClient(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name                  string
		opts                  options.InstallOptions
		wantRollbackOnFailure bool
		wantTimeout           time.Duration
	}{
		{
			name:                  "keeps a failed release when atomic is off",
			opts:                  options.InstallOptions{Name: "app"},
			wantRollbackOnFailure: false,
			wantTimeout:           defaultReleaseTimeout,
		},
		{
			name:                  "rolls back a failed release when atomic is on",
			opts:                  options.InstallOptions{Name: "app", Atomic: true},
			wantRollbackOnFailure: true,
			wantTimeout:           defaultAtomicReleaseTimeout,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			installClient, err := initInstallClient(new(action.Configuration), tt.opts)

			require.NoError(t, err)
			require.Equal(t, tt.wantRollbackOnFailure, installClient.RollbackOnFailure)
			require.Equal(t, tt.wantTimeout, installClient.Timeout)
		})
	}
}

func Test_namespaceExists(t *testing.T) {
	t.Parallel()

	t.Run("returns true when the namespace exists", func(t *testing.T) {
		t.Parallel()
		clientset := fake.NewClientset(&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "team-a"}})

		exists, err := namespaceExists(clientset, "team-a")

		require.NoError(t, err)
		require.True(t, exists)
	})

	t.Run("returns false when the namespace is missing", func(t *testing.T) {
		t.Parallel()
		clientset := fake.NewClientset()

		exists, err := namespaceExists(clientset, "team-a")

		require.NoError(t, err)
		require.False(t, exists)
	})

	t.Run("returns the error when the namespace cannot be read", func(t *testing.T) {
		t.Parallel()
		clientset := fake.NewClientset()
		forbidden := k8serrors.NewForbidden(schema.GroupResource{Resource: "namespaces"}, "team-a", errors.New("not allowed"))
		clientset.PrependReactor("get", "namespaces", func(k8stesting.Action) (bool, runtime.Object, error) {
			return true, nil, forbidden
		})

		exists, err := namespaceExists(clientset, "team-a")

		require.ErrorIs(t, err, forbidden)
		require.False(t, exists)
	})
}

func Test_shouldCreateNamespace(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		statusCode int
		want       bool
	}{
		{name: "skips creation when the namespace exists", statusCode: http.StatusOK, want: false},
		{name: "creates the namespace when it is missing", statusCode: http.StatusNotFound, want: true},
		{name: "skips creation when the caller cannot read namespaces", statusCode: http.StatusForbidden, want: false},
		{name: "leaves creation to Helm when the check fails", statusCode: http.StatusInternalServerError, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			actionConfig := newActionConfigForServer(t, namespaceAPIServer(t, tt.statusCode))

			require.Equal(t, tt.want, shouldCreateNamespace(actionConfig, "team-a"))
		})
	}
}

// namespaceAPIServer answers every namespace read with statusCode, returning
// team-a on success and a Kubernetes Status otherwise.
func namespaceAPIServer(t *testing.T, statusCode int) *httptest.Server {
	t.Helper()

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(statusCode)

		var body any = &corev1.Namespace{TypeMeta: metav1.TypeMeta{Kind: "Namespace", APIVersion: "v1"}, ObjectMeta: metav1.ObjectMeta{Name: "team-a"}}
		if statusCode != http.StatusOK {
			body = &metav1.Status{
				TypeMeta: metav1.TypeMeta{Kind: "Status", APIVersion: "v1"},
				Status:   metav1.StatusFailure,
				Code:     int32(statusCode),
			}
		}

		assert.NoError(t, json.NewEncoder(w).Encode(body))
	}))
	t.Cleanup(server.Close)

	return server
}

func newActionConfigForServer(t *testing.T, server *httptest.Server) *action.Configuration {
	t.Helper()

	actionConfig := new(action.Configuration)
	err := NewHelmSDKPackageManager().initActionConfig(actionConfig, "team-a", &options.KubernetesClusterAccess{
		ClusterName:      "test-cluster",
		ContextName:      "test-context",
		UserName:         "test-user",
		ClusterServerURL: server.URL,
	}, nil)
	require.NoError(t, err)

	return actionConfig
}
