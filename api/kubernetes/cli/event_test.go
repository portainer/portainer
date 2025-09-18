package cli

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

// TestGetEvents tests the GetEvents method
// It creates a fake Kubernetes client and passes it to the GetEvents method
// It then logs the fetched events and validated the data returned
func TestGetEvents(t *testing.T) {
	t.Run("can get events for resource id when admin", func(t *testing.T) {
		kcl := &KubeClient{
			cli:         kfake.NewSimpleClientset(),
			instanceID:  "instance",
			isKubeAdmin: true,
		}
		event := corev1.Event{
			InvolvedObject: corev1.ObjectReference{UID: "resourceId"},
			Action:         "something",
			ObjectMeta:     metav1.ObjectMeta{Namespace: "default", Name: "myEvent"},
			EventTime:      metav1.NowMicro(),
			Type:           "warning",
			Message:        "This event has a very serious warning",
		}
		_, err := kcl.cli.CoreV1().Events("default").Create(context.TODO(), &event, metav1.CreateOptions{})
		if err != nil {
			t.Fatalf("Failed to create Event: %v", err)
		}

		events, err := kcl.GetEvents("default", "resourceId")

		if err != nil {
			t.Fatalf("Failed to fetch Cron Jobs: %v", err)
		}
		t.Logf("Fetched Events: %v", events)
		require.Equal(t, 1, len(events), "Expected to return 1 event")
		assert.Equal(t, event.Message, events[0].Message, "Expected Message to be equal to event message created")
		assert.Equal(t, event.Type, events[0].Type, "Expected Type to be equal to event type created")
		assert.Equal(t, event.EventTime.UTC(), events[0].EventTime, "Expected EventTime to be saved as a string from event time created")
	})
	t.Run("can get kubernetes events for non admin namespace when non admin", func(t *testing.T) {
		kcl := &KubeClient{
			cli:                kfake.NewSimpleClientset(),
			instanceID:         "instance",
			isKubeAdmin:        false,
			nonAdminNamespaces: []string{"nonAdmin"},
		}
		event := corev1.Event{
			InvolvedObject: corev1.ObjectReference{UID: "resourceId"},
			Action:         "something",
			ObjectMeta:     metav1.ObjectMeta{Namespace: "nonAdmin", Name: "myEvent"},
			EventTime:      metav1.NowMicro(),
			Type:           "warning",
			Message:        "This event has a very serious warning",
		}
		_, err := kcl.cli.CoreV1().Events("nonAdmin").Create(context.TODO(), &event, metav1.CreateOptions{})
		if err != nil {
			t.Fatalf("Failed to create Event: %v", err)
		}

		events, err := kcl.GetEvents("nonAdmin", "resourceId")

		if err != nil {
			t.Fatalf("Failed to fetch Cron Jobs: %v", err)
		}
		t.Logf("Fetched Events: %v", events)
		require.Equal(t, 1, len(events), "Expected to return 1 event")
		assert.Equal(t, event.Message, events[0].Message, "Expected Message to be equal to event message created")
		assert.Equal(t, event.Type, events[0].Type, "Expected Type to be equal to event type created")
		assert.Equal(t, event.EventTime.UTC(), events[0].EventTime, "Expected EventTime to be saved as a string from event time created")
	})

	t.Run("cannot get kubernetes events for admin namespace when non admin", func(t *testing.T) {
		kcl := &KubeClient{
			cli:                kfake.NewSimpleClientset(),
			instanceID:         "instance",
			isKubeAdmin:        false,
			nonAdminNamespaces: []string{"nonAdmin"},
		}
		event := corev1.Event{
			InvolvedObject: corev1.ObjectReference{UID: "resourceId"},
			Action:         "something",
			ObjectMeta:     metav1.ObjectMeta{Namespace: "admin", Name: "myEvent"},
			EventTime:      metav1.NowMicro(),
			Type:           "warning",
			Message:        "This event has a very serious warning",
		}
		_, err := kcl.cli.CoreV1().Events("admin").Create(context.TODO(), &event, metav1.CreateOptions{})
		if err != nil {
			t.Fatalf("Failed to create Event: %v", err)
		}

		events, err := kcl.GetEvents("admin", "resourceId")

		if err != nil {
			t.Fatalf("Failed to fetch Cron Jobs: %v", err)
		}
		t.Logf("Fetched Events: %v", events)
		assert.Equal(t, 0, len(events), "Expected to return 0 events")
	})
}
