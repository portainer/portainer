package libkubectl

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strconv"
	"sync/atomic"
	"testing"

	"github.com/stretchr/testify/require"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/fake"
)

// TestDeleteDynamic tests require a Kubernetes cluster.
//
// Running the tests:
//   - With cluster: go test -v ./pkg/libkubectl -run TestDeleteDynamic
//   - Without cluster: Tests will skip automatically
//
// Test focus: Deletion logic and error handling, not resource type coverage.
// Resource type coverage is handled by ApplyDynamic tests.

func TestDeleteDynamic(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name      string
		manifests []string
		wantErr   bool
		desc      string
	}{
		{
			name: "delete simple resource",
			desc: "Test basic resource deletion - happy path",
			manifests: []string{
				`apiVersion: v1
kind: ConfigMap
metadata:
  name: test-delete-config
  namespace: default
data:
  key1: value1`,
			},
			wantErr: false,
		},
		{
			name: "delete multiple resources in one manifest",
			desc: "Test deletion with multiple resources separated by ---",
			manifests: []string{
				`apiVersion: v1
kind: ConfigMap
metadata:
  name: test-delete-config1
  namespace: default
data:
  key: value1
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-delete-config2
  namespace: default
data:
  key: value2`,
			},
			wantErr: false,
		},
		{
			name: "missing metadata name",
			desc: "Test manifest with missing name in metadata",
			manifests: []string{
				`apiVersion: v1
kind: ConfigMap
metadata:
  namespace: default
data:
  key: value`,
			},
			wantErr: true,
		},
		{
			name: "invalid resource type",
			desc: "Test deletion with non-existent resource type",
			manifests: []string{
				`apiVersion: v1
kind: NonExistentResourceType
metadata:
  name: test-invalid-type
  namespace: default`,
			},
			wantErr: true,
		},
		{
			name: "invalid apiVersion",
			desc: "Test deletion with invalid apiVersion",
			manifests: []string{
				`apiVersion: invalid/v999
kind: ConfigMap
metadata:
  name: test-invalid-apiversion
  namespace: default`,
			},
			wantErr: true,
		},
		{
			name: "partial failure with multiple resources",
			desc: "Test partial deletion with some invalid resources",
			manifests: []string{
				`apiVersion: v1
kind: ConfigMap
metadata:
  name: valid-config-for-delete
  namespace: default
data:
  key: value
---
apiVersion: invalid/v999
kind: ConfigMap
metadata:
  name: invalid-apiversion
  namespace: default
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: another-valid-config-for-delete
  namespace: default
data:
  key: value2`,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Skip if no Kubernetes cluster is available
			kubeconfig := skipIfNoKubeconfig(t)

			// Create client with empty namespace to let manifest namespaces be used
			client, err := NewClient(&ClientAccess{}, "", kubeconfig, false)
			require.NoError(t, err, "Failed to create client")

			// For tests that expect to delete existing resources, create them first
			// Only create resources for happy path tests
			shouldCreate := !tt.wantErr

			if shouldCreate {
				// Create the resources first
				_, err := client.ApplyDynamic(t.Context(), tt.manifests)
				require.NoError(t, err, "Failed to create resources for deletion test")
			}

			// Test DeleteDynamic
			output, err := client.DeleteDynamic(t.Context(), tt.manifests)

			if tt.wantErr {
				require.Error(t, err, "DeleteDynamic() expected error but got none")
			} else {
				require.NoError(t, err)
				require.NotEmpty(t, output, "DeleteDynamic() expected output but got empty string")
				require.Contains(t, output, "deleted", "DeleteDynamic() output should contain 'deleted'")
			}
		})
	}
}

// TestDeleteDynamicAlreadyDeleted tests the behavior when deleting resources that were already deleted
func TestDeleteDynamicAlreadyDeleted(t *testing.T) {
	t.Parallel()
	kubeconfig := skipIfNoKubeconfig(t)

	manifest := []string{
		`apiVersion: v1
kind: ConfigMap
metadata:
  name: test-double-delete
  namespace: default
data:
  key: value`,
	}

	client, err := NewClient(&ClientAccess{}, "", kubeconfig, false)
	require.NoError(t, err, "Failed to create client")

	// Create the resource
	_, err = client.ApplyDynamic(t.Context(), manifest)
	require.NoError(t, err, "Failed to create resource")

	// Delete it once
	_, err = client.DeleteDynamic(t.Context(), manifest)
	require.NoError(t, err, "First DeleteDynamic() failed")

	// Delete it again (should succeed since DeleteDynamic ignores not found errors)
	_, err = client.DeleteDynamic(t.Context(), manifest)
	require.NoError(t, err, "Second DeleteDynamic() should not return error for already deleted resource")
}

// TestDeleteDynamicPartialFailure tests deletion when some resources fail
func TestDeleteDynamicPartialFailure(t *testing.T) {
	t.Parallel()
	kubeconfig := skipIfNoKubeconfig(t)

	client, err := NewClient(&ClientAccess{}, "", kubeconfig, false)
	require.NoError(t, err, "Failed to create client")

	// Create one valid resource
	validManifest := []string{
		`apiVersion: v1
kind: ConfigMap
metadata:
  name: test-partial-delete-valid
  namespace: default
data:
  key: value`,
	}

	_, err = client.ApplyDynamic(t.Context(), validManifest)
	require.NoError(t, err, "Failed to create resource")

	t.Cleanup(func() {
		_, err = client.DeleteDynamic(context.Background(), validManifest)
		require.NoError(t, err, "Cleanup DeleteDynamic() failed")
	})

	// Try to delete valid resource + non-existent resource
	mixedManifests := []string{
		`apiVersion: v1
kind: ConfigMap
metadata:
  name: test-partial-delete-valid
  namespace: default
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: non-existent-resource-xyz
  namespace: default`,
	}

	_, err = client.DeleteDynamic(t.Context(), mixedManifests)
	require.NoError(t, err, "DeleteDynamic() should handle non-existent resources gracefully")
}

func TestDeleteResourceNamespaceResolution(t *testing.T) {
	t.Parallel()

	gvk := schema.GroupVersionKind{Version: "v1", Kind: "ConfigMap"}
	gvr := schema.GroupVersionResource{Version: "v1", Resource: "configmaps"}

	mapper := meta.NewDefaultRESTMapper(nil)
	mapper.Add(gvk, meta.RESTScopeNamespace)

	newConfigMap := func(namespace string) *unstructured.Unstructured {
		obj := &unstructured.Unstructured{}
		obj.SetGroupVersionKind(gvk)
		obj.SetName("cm")
		obj.SetNamespace(namespace)

		return obj
	}

	f := func(configuredNamespace, manifestNamespace, wantDeletedFrom string, wantErr bool) {
		t.Helper()

		client := fake.NewSimpleDynamicClientWithCustomListKinds(
			runtime.NewScheme(),
			map[schema.GroupVersionResource]string{gvr: "ConfigMapList"},
			newConfigMap("default"), newConfigMap("stack-ns"),
		)

		manifest := "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: cm\n"
		if manifestNamespace != "" {
			manifest += "  namespace: " + manifestNamespace + "\n"
		}

		_, err := (&Client{}).deleteResource(t.Context(), client, mapper, configuredNamespace, []byte(manifest))
		if wantErr {
			require.Error(t, err)
		} else {
			require.NoError(t, err)
		}

		for _, namespace := range []string{"default", "stack-ns"} {
			_, err := client.Resource(gvr).Namespace(namespace).Get(t.Context(), "cm", metav1.GetOptions{})
			if namespace == wantDeletedFrom {
				require.True(t, apierrors.IsNotFound(err), "expected cm to be deleted from %s", namespace)
				continue
			}

			require.NoError(t, err, "cm must still exist in %s", namespace)
		}
	}

	// The manifest names no namespace, so the stack's namespace is used instead of default
	f("stack-ns", "", "stack-ns", false)

	// The manifest namespace matches the stack's namespace
	f("stack-ns", "stack-ns", "stack-ns", false)

	// The manifest namespace conflicts with the stack's namespace, nothing is deleted
	f("stack-ns", "default", "", true)

	// No configured namespace, the manifest namespace is used
	f("", "stack-ns", "stack-ns", false)

	// Neither is set, default is used
	f("", "", "default", false)
}

func TestDeleteDynamicUsesConfiguredNamespace(t *testing.T) {
	t.Parallel()

	f := func(namespace, manifestNamespace, wantPath string, deleteStatus int, wantErr bool) {
		t.Helper()

		var deletedPath atomic.Value

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")

			switch {
			case r.Method == http.MethodDelete:
				deletedPath.Store(r.URL.Path)
				w.WriteHeader(deleteStatus)
				_, _ = w.Write([]byte(`{"kind":"Status","apiVersion":"v1","code":` + strconv.Itoa(deleteStatus) + `}`))
			case r.URL.Path == "/api":
				_, _ = w.Write([]byte(`{"kind":"APIVersions","versions":["v1"]}`))
			case r.URL.Path == "/api/v1":
				_, _ = w.Write([]byte(`{"kind":"APIResourceList","groupVersion":"v1","resources":[{"name":"configmaps","namespaced":true,"kind":"ConfigMap","verbs":["delete"]}]}`))
			default:
				_, _ = w.Write([]byte(`{"kind":"APIGroupList","groups":[]}`))
			}
		}))
		defer server.Close()

		client, err := NewClient(&ClientAccess{ServerUrl: server.URL}, namespace, "", true)
		require.NoError(t, err)

		manifest := "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: cm\n"
		if manifestNamespace != "" {
			manifest += "  namespace: " + manifestNamespace + "\n"
		}

		_, err = client.DeleteDynamic(t.Context(), []string{manifest})
		if wantErr {
			require.Error(t, err)
		} else {
			require.NoError(t, err)
		}

		got, _ := deletedPath.Load().(string)
		require.Equal(t, wantPath, got)
	}

	// The manifest names no namespace, so the stack's namespace is used
	f("stack-ns", "", "/api/v1/namespaces/stack-ns/configmaps/cm", http.StatusOK, false)

	// No namespace is configured, so the manifest namespace is used
	f("", "other", "/api/v1/namespaces/other/configmaps/cm", http.StatusOK, false)

	// A server failure other than not found is reported
	f("stack-ns", "", "/api/v1/namespaces/stack-ns/configmaps/cm", http.StatusInternalServerError, true)

	// A missing resource is ignored
	f("stack-ns", "", "/api/v1/namespaces/stack-ns/configmaps/cm", http.StatusNotFound, false)
}
