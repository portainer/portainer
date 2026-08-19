package sdk

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
)

func TestParseResources(t *testing.T) {
	t.Parallel()
	t.Run("successfully parse single resource", func(t *testing.T) {
		resourceTypesLists := map[string][]runtime.Object{
			"v1/Pod(related)": {
				&unstructured.Unstructured{
					Object: map[string]any{
						"apiVersion": "v1",
						"kind":       "Pod",
						"metadata": map[string]any{
							"name":      "test-pod",
							"namespace": "default",
						},
						"status": map[string]any{
							"phase": "Available",
						},
					},
				},
			},
		}

		got, err := parseResources(resourceTypesLists)
		require.NoError(t, err)
		assert.Len(t, got, 1)

		// Check resource metadata
		assert.Equal(t, "test-pod", got[0].GetName())
		assert.Equal(t, "default", got[0].GetNamespace())

		// Check status and condition
		statusMap, found, _ := unstructured.NestedMap(got[0].Object, "status")
		assert.True(t, found)
		assert.Equal(t, "Available", statusMap["phase"])

		healthSummary, found, _ := unstructured.NestedMap(statusMap, "healthSummary")
		assert.True(t, found)
		assert.Equal(t, "Healthy", healthSummary["status"])
		assert.Equal(t, "Available", healthSummary["reason"])
	})

	t.Run("successfully parse multiple resources", func(t *testing.T) {
		resourceTypesLists := map[string][]runtime.Object{
			"v1/Pod(related)": {
				&unstructured.Unstructured{
					Object: map[string]any{
						"apiVersion": "v1",
						"kind":       "Pod",
						"metadata": map[string]any{
							"name":      "test-pod-1",
							"namespace": "default",
						},
						"status": map[string]any{
							"phase": "Pending",
						},
					},
				},
				&unstructured.Unstructured{
					Object: map[string]any{
						"apiVersion": "v1",
						"kind":       "Pod",
						"metadata": map[string]any{
							"name":      "test-pod-2",
							"namespace": "default",
						},
						"status": map[string]any{
							"phase": "Error",
						},
					},
				},
			},
		}

		got, err := parseResources(resourceTypesLists)
		require.NoError(t, err)
		assert.Len(t, got, 2)

		// Check first resource
		assert.Equal(t, "test-pod-1", got[0].GetName())
		statusMap1, found, _ := unstructured.NestedMap(got[0].Object, "status")
		assert.True(t, found)
		assert.Equal(t, "Pending", statusMap1["phase"])

		healthSummary1, found, _ := unstructured.NestedMap(statusMap1, "healthSummary")
		assert.True(t, found)
		assert.Equal(t, Progressing, healthSummary1["status"])
		assert.Equal(t, "Pending", healthSummary1["reason"])

		// Check second resource
		assert.Equal(t, "test-pod-2", got[1].GetName())
		statusMap2, found, _ := unstructured.NestedMap(got[1].Object, "status")
		assert.True(t, found)
		healthSummary2, found, _ := unstructured.NestedMap(statusMap2, "healthSummary")
		assert.True(t, found)
		assert.Equal(t, Unhealthy, healthSummary2["status"])
		assert.Equal(t, "Error", healthSummary2["reason"])
	})
}

func TestEnhanceStatus(t *testing.T) {
	t.Parallel()
	t.Run("healthy running pod", func(t *testing.T) {
		// Create a ResourceStatus object
		status := &ResourceStatus{
			Phase: "Failed",
		}

		conditions := []metav1.Condition{}

		result := summarizeStatus(status, conditions, "test-pod", "default", nil)

		assert.Equal(t, Unhealthy, result.HealthSummary.Status)
		assert.Equal(t, "Failed", result.HealthSummary.Reason)
	})

	t.Run("unhealthy pod with error", func(t *testing.T) {
		// Create a ResourceStatus object
		status := &ResourceStatus{
			Phase: "Error",
		}

		conditions := []metav1.Condition{
			{
				Type:   "DisruptionAllowed",
				Status: metav1.ConditionFalse,
				Reason: "InsufficientPods",
			},
		}

		result := summarizeStatus(status, conditions, "test-pod", "default", nil)

		assert.Equal(t, Unhealthy, result.HealthSummary.Status)
		assert.Equal(t, "Error", result.HealthSummary.Reason)
	})
}
