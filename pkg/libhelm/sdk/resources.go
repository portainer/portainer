package sdk

import (
	"time"

	"github.com/segmentio/encoding/json"

	"github.com/rs/zerolog/log"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
)

const (
	Unknown     = "Unknown"
	Healthy     = "Healthy"
	Unhealthy   = "Unhealthy"
	Progressing = "Progressing"
)

// ResourceStatus represents a generic status for any Kubernetes resource.
type ResourceStatus struct {
	// Phase is a simple, high-level summary of where the resource is in its lifecycle.
	Phase string `json:"phase,omitempty"`

	// HealthSummary represents the summarized health status of the resource
	HealthSummary *HealthCondition `json:"healthSummary,omitempty"`

	// Reason is a brief CamelCase string containing the reason for the resource's current status.
	Reason string `json:"reason,omitempty"`

	// Message is a human-readable description of the current status.
	Message string `json:"message,omitempty"`
}

// HealthCondition represents a summarized health condition for a resource
type HealthCondition struct {
	Status  string `json:"status,omitempty"`
	Reason  string `json:"reason,omitempty"`
	Message string `json:"message,omitempty"`
}

// parseResources returns a list of resources with additional status information, in a consistent format.
func parseResources(resourceTypesLists map[string][]runtime.Object) ([]*unstructured.Unstructured, error) {
	flattenedResources := flattenResources(resourceTypesLists)

	resourcesInfo := []*unstructured.Unstructured{}
	for _, resource := range flattenedResources {
		info, err := getResourceInfo(resource)
		if err != nil {
			return nil, err
		}

		resourcesInfo = append(resourcesInfo, info)
	}

	return resourcesInfo, nil
}

func getResourceInfo(obj runtime.Object) (*unstructured.Unstructured, error) {
	data, err := json.Marshal(obj)
	if err != nil {
		return nil, err
	}

	res := &unstructured.Unstructured{}
	err = json.Unmarshal(data, res)
	if err != nil {
		return nil, err
	}

	status, conditions, err := extractStatus(res)
	if err == nil {
		summarizeStatus(status, conditions, res.GetName(), res.GetNamespace(), err)
		applyStatusToResource(res, status)
	}

	// only keep metadata, kind and status (other fields are not needed)
	res.Object = map[string]any{
		"metadata": res.Object["metadata"],
		"kind":     res.Object["kind"],
		"status":   res.Object["status"],
	}

	return res, nil
}

// extractStatus extracts the status from an unstructured resource
func extractStatus(res *unstructured.Unstructured) (*ResourceStatus, []metav1.Condition, error) {
	statusMap, found, err := unstructured.NestedMap(res.Object, "status")
	if !found || err != nil {
		return &ResourceStatus{}, nil, nil
	}

	// Extract basic status fields
	phase, _, _ := unstructured.NestedString(statusMap, "phase")
	reason, _, _ := unstructured.NestedString(statusMap, "reason")
	message, _, _ := unstructured.NestedString(statusMap, "message")

	// Extract conditions for analysis
	conditions := []metav1.Condition{}
	conditionsData, found, _ := unstructured.NestedSlice(statusMap, "conditions")
	if found {
		for _, condData := range conditionsData {
			condMap, ok := condData.(map[string]any)
			if !ok {
				continue
			}

			cond := metav1.Condition{}
			if typeStr, ok := condMap["type"].(string); ok {
				cond.Type = typeStr
			}
			if statusStr, ok := condMap["status"].(string); ok {
				cond.Status = metav1.ConditionStatus(statusStr)
			}
			if reasonStr, ok := condMap["reason"].(string); ok {
				cond.Reason = reasonStr
			}
			if msgStr, ok := condMap["message"].(string); ok {
				cond.Message = msgStr
			}
			if timeStr, ok := condMap["lastTransitionTime"].(string); ok {
				t, _ := time.Parse(time.RFC3339, timeStr)
				cond.LastTransitionTime = metav1.Time{Time: t}
			}

			conditions = append(conditions, cond)
		}
	}

	return &ResourceStatus{
		Phase:   phase,
		Reason:  reason,
		Message: message,
	}, conditions, nil
}

// summarizeStatus creates a health summary based on resource status and conditions
func summarizeStatus(status *ResourceStatus, conditions []metav1.Condition, name string, namespace string, err error) *ResourceStatus {
	healthSummary := &HealthCondition{
		Status:  Unknown,
		Reason:  status.Reason,
		Message: status.Message,
	}

	// Handle error case first
	if err != nil {
		healthSummary.Reason = "ErrorGettingStatus"
		healthSummary.Message = err.Error()
		status.HealthSummary = healthSummary
		return status
	}

	// Handle phase-based status
	switch status.Phase {
	case "Error":
		healthSummary.Status = Unhealthy
		healthSummary.Reason = status.Phase
	case "Running":
		healthSummary.Status = Healthy
		healthSummary.Reason = status.Phase
	case "Pending":
		healthSummary.Status = Progressing
		healthSummary.Reason = status.Phase
	case "Failed":
		healthSummary.Status = Unhealthy
		healthSummary.Reason = status.Phase
	case "Available", "Active", "Established", "Bound", "Ready", "Succeeded":
		healthSummary.Status = Healthy
		healthSummary.Reason = status.Phase
	case "":
		// Empty phase - check conditions or default to "Exists"
		if len(conditions) > 0 {
			analyzeConditions(conditions, healthSummary)
		} else {
			healthSummary.Status = Healthy
			healthSummary.Reason = "Exists"
		}
	default:
		log.Warn().
			Str("context", "HelmClient").
			Str("namespace", namespace).
			Str("name", name).
			Str("phase", status.Phase).
			Msg("Unhandled status")
		healthSummary.Reason = status.Phase
	}

	// Set message from first condition if available
	if len(conditions) > 0 && healthSummary.Message == "" {
		healthSummary.Message = conditions[0].Message
	}

	status.HealthSummary = healthSummary
	return status
}

// analyzeConditions determines resource health based on standard condition types
func analyzeConditions(conditions []metav1.Condition, healthSummary *HealthCondition) {
	for _, cond := range conditions {
		switch cond.Type {
		case "Progressing":
			if cond.Status == "False" {
				healthSummary.Status = Unhealthy
				healthSummary.Reason = cond.Reason
			} else if cond.Reason != "NewReplicaSetAvailable" {
				healthSummary.Status = Unknown
				healthSummary.Reason = cond.Reason
			}
		case "Available", "Ready", "DisruptionAllowed", "Established", "NamesAccepted":
			if healthSummary.Status == Unknown ||
				(cond.Type == "Established" && healthSummary.Status == Healthy) ||
				(cond.Type == "NamesAccepted" && healthSummary.Status == Healthy) {
				if cond.Status == "False" {
					healthSummary.Status = Unhealthy
				} else {
					healthSummary.Status = Healthy
				}
				healthSummary.Reason = cond.Reason
			}
		case "ContainersReady":
			if healthSummary.Status == Unknown && cond.Status == "False" {
				healthSummary.Status = Unhealthy
				healthSummary.Reason = cond.Reason
			}
		}
	}
}

// applyStatusToResource applies the typed ResourceStatus back to the unstructured resource
func applyStatusToResource(res *unstructured.Unstructured, status *ResourceStatus) {
	statusMap := map[string]any{
		"phase":   status.Phase,
		"reason":  status.Reason,
		"message": status.Message,
	}

	if status.HealthSummary != nil {
		statusMap["healthSummary"] = map[string]any{
			"status":  status.HealthSummary.Status,
			"reason":  status.HealthSummary.Reason,
			"message": status.HealthSummary.Message,
		}
	}

	if err := unstructured.SetNestedMap(res.Object, statusMap, "status"); err != nil {
		log.Warn().Err(err).Msg("failed to set status on resource")
	}
}

// flattenResources extracts items from a list resource and convert them to runtime.Objects
func flattenResources(resourceTypesLists map[string][]runtime.Object) []runtime.Object {
	flattenedResources := []runtime.Object{}

	for _, resourceTypeList := range resourceTypesLists {
		for _, resourceItem := range resourceTypeList {
			// if the resource item is a list, we need to flatten it too e.g. PodList
			items := extractItemsIfList(resourceItem)
			if items != nil {
				flattenedResources = append(flattenedResources, items...)
			} else {
				flattenedResources = append(flattenedResources, resourceItem)
			}
		}
	}

	return flattenedResources
}

// extractItemsIfList extracts items if the resource is a list, or returns nil if not a list
func extractItemsIfList(resource runtime.Object) []runtime.Object {
	unstructuredObj, ok := resource.(runtime.Unstructured)
	if !ok {
		return nil
	}

	if !unstructuredObj.IsList() {
		return nil
	}

	extractedItems := []runtime.Object{}
	err := unstructuredObj.EachListItem(func(obj runtime.Object) error {
		extractedItems = append(extractedItems, obj)
		return nil
	})

	if err != nil {
		return nil
	}

	return extractedItems
}
