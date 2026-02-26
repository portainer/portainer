package libkubectl

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"
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
				_, err := client.ApplyDynamic(context.Background(), tt.manifests)
				require.NoError(t, err, "Failed to create resources for deletion test")
			}

			// Test DeleteDynamic
			output, err := client.DeleteDynamic(context.Background(), tt.manifests)

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
	_, err = client.ApplyDynamic(context.Background(), manifest)
	require.NoError(t, err, "Failed to create resource")

	// Delete it once
	_, err = client.DeleteDynamic(context.Background(), manifest)
	require.NoError(t, err, "First DeleteDynamic() failed")

	// Delete it again (should succeed since DeleteDynamic ignores not found errors)
	_, err = client.DeleteDynamic(context.Background(), manifest)
	require.NoError(t, err, "Second DeleteDynamic() should not return error for already deleted resource")
}

// TestDeleteDynamicPartialFailure tests deletion when some resources fail
func TestDeleteDynamicPartialFailure(t *testing.T) {
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

	_, err = client.ApplyDynamic(context.Background(), validManifest)
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

	_, err = client.DeleteDynamic(context.Background(), mixedManifests)
	require.NoError(t, err, "DeleteDynamic() should handle non-existent resources gracefully")
}
