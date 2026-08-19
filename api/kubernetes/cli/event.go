package cli

import (
	"context"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetEvents gets all the Events for a given namespace and resource
// If the user is a kube admin, it returns all events in the namespace
// Otherwise, it returns only the events in the non-admin namespaces
func (kcl *KubeClient) GetEvents(namespace string, resourceId string) ([]models.K8sEvent, error) {
	if kcl.GetIsKubeAdmin() {
		return kcl.fetchAllEvents(namespace, resourceId)
	}

	return kcl.fetchEventsForNonAdmin(namespace, resourceId)
}

// fetchEventsForNonAdmin returns all events in the given namespace and resource
// It returns only the events in the non-admin namespaces
func (kcl *KubeClient) fetchEventsForNonAdmin(namespace string, resourceId string) ([]models.K8sEvent, error) {
	if len(kcl.GetClientNonAdminNamespaces()) == 0 {
		return nil, nil
	}

	events, err := kcl.fetchAllEvents(namespace, resourceId)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sEvent, 0)
	for _, event := range events {
		if _, ok := nonAdminNamespaceSet[event.Namespace]; ok {
			results = append(results, event)
		}
	}

	return results, nil
}

// fetchEventsForNonAdmin returns all events in the given namespace and resource
// It returns all events in the namespace and resource
func (kcl *KubeClient) fetchAllEvents(namespace string, resourceId string) ([]models.K8sEvent, error) {
	options := metav1.ListOptions{}
	if resourceId != "" {
		options.FieldSelector = "involvedObject.uid=" + resourceId
	}

	list, err := kcl.cli.CoreV1().Events(namespace).List(context.TODO(), options)
	if err != nil {
		return nil, err
	}

	results := make([]models.K8sEvent, 0)
	for _, event := range list.Items {
		results = append(results, parseEvent(&event))
	}

	return results, nil
}

func parseEvent(event *corev1.Event) models.K8sEvent {
	result := models.K8sEvent{
		Type:      event.Type,
		Name:      event.Name,
		Message:   event.Message,
		Reason:    event.Reason,
		Namespace: event.Namespace,
		EventTime: event.EventTime.UTC(),
		Kind:      event.Kind,
		Count:     event.Count,
		UID:       string(event.GetUID()),
		InvolvedObjectKind: models.K8sEventInvolvedObject{
			Kind:      event.InvolvedObject.Kind,
			UID:       string(event.InvolvedObject.UID),
			Name:      event.InvolvedObject.Name,
			Namespace: event.InvolvedObject.Namespace,
		},
	}

	if !event.LastTimestamp.Time.IsZero() {
		result.LastTimestamp = &event.LastTimestamp.Time
	}
	if !event.FirstTimestamp.Time.IsZero() {
		result.FirstTimestamp = &event.FirstTimestamp.Time
	}

	return result
}
