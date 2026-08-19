package cli

import (
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
	t.Parallel()
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

		_, err := kcl.cli.CoreV1().Events("default").Create(t.Context(), &event, metav1.CreateOptions{})
		require.NoError(t, err, "Failed to create Event")

		events, err := kcl.GetEvents("default", "resourceId")
		require.NoError(t, err, "Failed to fetch Events")

		t.Logf("Fetched Events: %v", events)
		require.Len(t, events, 1, "Expected to return 1 event")
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

		_, err := kcl.cli.CoreV1().Events("nonAdmin").Create(t.Context(), &event, metav1.CreateOptions{})
		require.NoError(t, err, "Failed to create Event")

		events, err := kcl.GetEvents("nonAdmin", "resourceId")
		require.NoError(t, err, "Failed to fetch Cron Jobs")

		t.Logf("Fetched Events: %v", events)
		require.Len(t, events, 1, "Expected to return 1 event")
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

		_, err := kcl.cli.CoreV1().Events("admin").Create(t.Context(), &event, metav1.CreateOptions{})
		require.NoError(t, err, "Failed to create Event")

		events, err := kcl.GetEvents("admin", "resourceId")
		require.NoError(t, err, "Failed to fetch Cron Jobs")
		t.Logf("Fetched Events: %v", events)
		assert.Empty(t, events, "Expected to return 0 events")
	})
}
