package libkubectl

import (
	"context"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/fake"
	k8stesting "k8s.io/client-go/testing"
)

const configMapManifest = `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  key: value`

const deploymentManifest = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  replicas: 1`

// newDryRunSetup wires the fake dynamic client and test mapper into an apply setup,
// so the dry-run loop can be exercised without a cluster.
func newDryRunSetup(client *fake.FakeDynamicClient, namespace string) *applySetup {
	return &applySetup{dynamicClient: client, mapper: newTestMapper(), configuredNamespace: namespace}
}

func TestDryRunManifests(t *testing.T) {
	t.Parallel()

	t.Run("sends every resource with dry-run enabled", func(t *testing.T) {
		t.Parallel()
		dynamicClient := newFakeDynamicClient()
		client := &Client{}

		results, err := client.dryRunManifests(t.Context(), newDryRunSetup(dynamicClient, "my-ns"), []string{configMapManifest + "\n---\n" + deploymentManifest})

		require.NoError(t, err)
		require.Len(t, results, 2)
		for _, result := range results {
			assert.True(t, result.Success, result.Message)
			assert.Equal(t, "my-ns", result.Namespace)
		}
		assert.Equal(t, "ConfigMap", results[0].Kind)
		assert.Equal(t, "app-config", results[0].Name)

		patches := 0
		for _, action := range dynamicClient.Actions() {
			patch, ok := action.(k8stesting.PatchActionImpl)
			if !ok {
				continue
			}
			patches++
			assert.Equal(t, []string{metav1.DryRunAll}, patch.PatchOptions.DryRun, "the apply must not persist anything")
		}
		assert.Equal(t, 2, patches)
	})

	t.Run("validates every document of a manifest written with windows line endings", func(t *testing.T) {
		t.Parallel()
		client := &Client{}

		manifest := strings.ReplaceAll(configMapManifest+"\n---\n"+deploymentManifest, "\n", "\r\n")
		results, err := client.dryRunManifests(t.Context(), newDryRunSetup(newFakeDynamicClient(), "my-ns"), []string{manifest})

		require.NoError(t, err)
		require.Len(t, results, 2, "a separator with CRLF endings must not hide the documents that follow it")
		assert.Equal(t, "ConfigMap", results[0].Kind)
		assert.Equal(t, "Deployment", results[1].Kind)
	})

	t.Run("reports a rejected resource without aborting the run", func(t *testing.T) {
		t.Parallel()
		client := &Client{}

		// The configured namespace conflicts with the one in the first document only.
		conflicting := `apiVersion: v1
kind: ConfigMap
metadata:
  name: other-config
  namespace: manifest-ns`
		results, err := client.dryRunManifests(t.Context(), newDryRunSetup(newFakeDynamicClient(), "my-ns"), []string{conflicting, configMapManifest})

		require.NoError(t, err)
		require.Len(t, results, 2)
		assert.False(t, results[0].Success)
		assert.Contains(t, results[0].Message, "namespace conflict")
		assert.Equal(t, "ConfigMap", results[0].Kind, "a rejected resource must still be identified")
		assert.Equal(t, "other-config", results[0].Name)
		assert.True(t, results[1].Success, results[1].Message)
	})

	t.Run("reports a resource the cluster does not know", func(t *testing.T) {
		t.Parallel()
		client := &Client{}

		results, err := client.dryRunManifests(t.Context(), newDryRunSetup(newFakeDynamicClient(), ""), []string{`apiVersion: acme.com/v1
kind: Widget
metadata:
  name: sprocket`})

		require.NoError(t, err)
		require.Len(t, results, 1)
		assert.False(t, results[0].Success)
		assert.Contains(t, results[0].Message, "failed to map resource type")
		assert.Equal(t, "Widget", results[0].Kind)
	})

	t.Run("creates with dry-run enabled when the resource does not exist", func(t *testing.T) {
		t.Parallel()
		dynamicClient := newFakeDynamicClient()
		dynamicClient.PrependReactor("patch", "*", func(k8stesting.Action) (bool, runtime.Object, error) {
			return true, nil, apierrors.NewNotFound(schema.GroupResource{Resource: "configmaps"}, "app-config")
		})
		client := &Client{}

		results, err := client.dryRunManifests(t.Context(), newDryRunSetup(dynamicClient, "my-ns"), []string{configMapManifest})

		require.NoError(t, err)
		require.Len(t, results, 1)
		assert.True(t, results[0].Success, results[0].Message)

		creates := 0
		for _, action := range dynamicClient.Actions() {
			create, ok := action.(k8stesting.CreateActionImpl)
			if !ok {
				continue
			}
			creates++
			assert.Equal(t, []string{metav1.DryRunAll}, create.CreateOptions.DryRun, "the create fallback must not persist anything")
		}
		assert.Equal(t, 1, creates)
	})

	t.Run("skips documents holding no resource", func(t *testing.T) {
		t.Parallel()
		client := &Client{}

		results, err := client.dryRunManifests(t.Context(), newDryRunSetup(newFakeDynamicClient(), ""), []string{"# just a comment\n---\n\n---\n" + configMapManifest})

		require.NoError(t, err)
		require.Len(t, results, 1)
		assert.Equal(t, "app-config", results[0].Name)
		assert.Equal(t, 1, results[0].DocumentIndex, "a skipped document still holds its position")
	})

	t.Run("attributes documents rejected before their resource is named", func(t *testing.T) {
		t.Parallel()
		client := &Client{}

		results, err := client.dryRunManifests(t.Context(), newDryRunSetup(newFakeDynamicClient(), ""), []string{"not: [valid", "foo: bar"})

		require.NoError(t, err)
		require.Len(t, results, 2)
		assert.Empty(t, results[0].Kind)
		assert.Empty(t, results[1].Kind)
		assert.Equal(t, 0, results[0].DocumentIndex, "unnamed documents must stay distinguishable")
		assert.Equal(t, 1, results[1].DocumentIndex)
	})

	t.Run("reports an interrupted run instead of blaming the manifests", func(t *testing.T) {
		t.Parallel()
		dynamicClient := newFakeDynamicClient()
		ctx, cancel := context.WithCancel(t.Context())
		defer cancel()
		dynamicClient.PrependReactor("patch", "*", func(k8stesting.Action) (bool, runtime.Object, error) {
			cancel()
			return true, nil, context.Canceled
		})
		client := &Client{}

		results, err := client.dryRunManifests(ctx, newDryRunSetup(dynamicClient, "my-ns"), []string{configMapManifest + "\n---\n" + deploymentManifest})

		require.ErrorIs(t, err, context.Canceled)
		assert.Nil(t, results, "documents that were never validated must not be reported as rejected")
	})
}

// TestApplyDryRun requires a Kubernetes cluster and skips without one, like TestApplyDynamic.
func TestApplyDryRun(t *testing.T) {
	t.Parallel()

	kubeconfig := skipIfNoKubeconfig(t)

	client, err := NewClient(&ClientAccess{}, "default", kubeconfig, false)
	require.NoError(t, err)

	results, err := client.ApplyDryRun(t.Context(), []string{configMapManifest})
	require.NoError(t, err)

	require.Len(t, results, 1)
	assert.True(t, results[0].Success, results[0].Message)

	_, err = client.Describe("default", "app-config", "configmap")
	assert.Error(t, err, "a dry-run must not create the resource")
}
