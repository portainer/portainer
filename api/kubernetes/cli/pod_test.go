package cli

import (
	"context"
	"errors"
	"io"
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	v1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func TestDeletePod(t *testing.T) {
	t.Parallel()

	t.Run("deletes an existing pod", func(t *testing.T) {
		t.Parallel()
		pod := &v1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "my-pod", Namespace: "default"}}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(pod)}

		err := kcl.DeletePod("default", "my-pod")
		require.NoError(t, err)
	})

	t.Run("returns not-found error for a missing pod", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset()}

		err := kcl.DeletePod("default", "nonexistent")
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err), "expected a not-found error, got: %v", err)
	})

	t.Run("deletes only the named pod leaving others intact", func(t *testing.T) {
		t.Parallel()
		podA := &v1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "pod-a", Namespace: "default"}}
		podB := &v1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "pod-b", Namespace: "default"}}
		fakeClient := kfake.NewSimpleClientset(podA, podB)
		kcl := &KubeClient{cli: fakeClient}

		err := kcl.DeletePod("default", "pod-a")
		require.NoError(t, err)

		_, err = fakeClient.CoreV1().Pods("default").Get(t.Context(), "pod-a", metav1.GetOptions{})
		assert.True(t, k8serrors.IsNotFound(err), "pod-a should have been deleted")

		_, err = fakeClient.CoreV1().Pods("default").Get(t.Context(), "pod-b", metav1.GetOptions{})
		require.NoError(t, err, "pod-b should still exist")
	})

	t.Run("returns not-found when pod exists in a different namespace", func(t *testing.T) {
		t.Parallel()
		pod := &v1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "my-pod", Namespace: "other"}}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(pod)}

		err := kcl.DeletePod("default", "my-pod")
		require.Error(t, err)
		assert.True(t, k8serrors.IsNotFound(err))
	})
}

func TestGetPods(t *testing.T) {
	t.Parallel()

	newPod := func(name, namespace string) *v1.Pod {
		return &v1.Pod{ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: namespace}}
	}

	t.Run("admin gets all pods across namespaces", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			newPod("pod-a", "ns-a"),
			newPod("pod-b", "ns-b"),
		)}
		kcl.SetIsKubeAdmin(true)

		pods, err := kcl.GetPods("", models.K8sResourceListOptions{})
		require.NoError(t, err)
		assert.Len(t, pods, 2)
	})

	t.Run("admin scoped to a single namespace gets only that namespace's pods", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			newPod("pod-a", "ns-a"),
			newPod("pod-b", "ns-b"),
		)}
		kcl.SetIsKubeAdmin(true)

		pods, err := kcl.GetPods("ns-a", models.K8sResourceListOptions{})
		require.NoError(t, err)
		require.Len(t, pods, 1)
		assert.Equal(t, "pod-a", pods[0].Name)
	})

	t.Run("labelSelector narrows results to matching pods", func(t *testing.T) {
		t.Parallel()
		web := &v1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "pod-web", Namespace: "ns-a", Labels: map[string]string{"app": "web"}}}
		db := &v1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "pod-db", Namespace: "ns-a", Labels: map[string]string{"app": "db"}}}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(web, db)}
		kcl.SetIsKubeAdmin(true)

		pods, err := kcl.GetPods("ns-a", models.K8sResourceListOptions{LabelSelector: "app=web"})
		require.NoError(t, err)
		require.Len(t, pods, 1)
		assert.Equal(t, "pod-web", pods[0].Name)
	})

	t.Run("non-admin with no accessible namespaces gets no pods", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(newPod("pod-a", "ns-a"))}
		kcl.SetIsKubeAdmin(false)

		pods, err := kcl.GetPods("", models.K8sResourceListOptions{})
		require.NoError(t, err)
		assert.Empty(t, pods)
	})

	t.Run("non-admin gets only pods in accessible namespaces", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			newPod("pod-a", "ns-a"),
			newPod("pod-b", "ns-b"),
			newPod("pod-c", "ns-c"),
		)}
		kcl.SetIsKubeAdmin(false)
		kcl.SetClientNonAdminNamespaces([]string{"ns-a", "ns-c"})

		pods, err := kcl.GetPods("", models.K8sResourceListOptions{})
		require.NoError(t, err)
		require.Len(t, pods, 2)
		assert.ElementsMatch(t, []string{"pod-a", "pod-c"}, []string{pods[0].Name, pods[1].Name})
	})

	t.Run("non-admin never sees system namespace pods even when granted access", func(t *testing.T) {
		t.Parallel()
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(
			newPod("pod-a", "ns-a"),
			newPod("kube-pod", "kube-system"),
		)}
		kcl.SetIsKubeAdmin(false)
		kcl.SetClientNonAdminNamespaces([]string{"ns-a", "kube-system"})

		pods, err := kcl.GetPods("", models.K8sResourceListOptions{})
		require.NoError(t, err)
		require.Len(t, pods, 1)
		assert.Equal(t, "pod-a", pods[0].Name)
	})
}

func TestGetPodLogsStream(t *testing.T) {
	t.Parallel()

	readAll := func(t *testing.T, rc io.ReadCloser) string {
		t.Helper()
		defer func() { _ = rc.Close() }()
		data, err := io.ReadAll(rc)
		require.NoError(t, err)
		return string(data)
	}

	t.Run("returns the pod logs stream", func(t *testing.T) {
		t.Parallel()
		pod := &v1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "my-pod", Namespace: "default"}}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(pod)}

		stream, err := kcl.GetPodLogsStream(t.Context(), "default", "my-pod", v1.PodLogOptions{})
		require.NoError(t, err)
		assert.Equal(t, "fake logs", readAll(t, stream))
	})

	t.Run("passes options through without error", func(t *testing.T) {
		t.Parallel()
		pod := &v1.Pod{ObjectMeta: metav1.ObjectMeta{Name: "my-pod", Namespace: "default"}}
		kcl := &KubeClient{cli: kfake.NewSimpleClientset(pod)}

		tail := int64(10)
		since := int64(60)
		stream, err := kcl.GetPodLogsStream(t.Context(), "default", "my-pod", v1.PodLogOptions{
			Container:    "app",
			TailLines:    &tail,
			SinceSeconds: &since,
			Timestamps:   true,
			Previous:     true,
			Follow:       true,
		})
		require.NoError(t, err)
		assert.Equal(t, "fake logs", readAll(t, stream))
	})
}

func Test_waitForPodStatus(t *testing.T) {
	t.Parallel()

	t.Run("successfully errors on cancelled context", func(t *testing.T) {
		k := &KubeClient{
			cli:        kfake.NewSimpleClientset(),
			instanceID: "test",
		}

		podSpec := &v1.Pod{
			ObjectMeta: metav1.ObjectMeta{Name: "test", Namespace: defaultNamespace},
			Spec: v1.PodSpec{
				Containers: []v1.Container{
					{Name: "test-pod", Image: "containous/whoami"},
				},
			},
		}

		ctx, cancel := context.WithCancel(t.Context())
		cancel()
		err := k.waitForPodStatus(ctx, v1.PodRunning, podSpec)
		if !errors.Is(err, context.Canceled) {
			t.Errorf("waitForPodStatus should throw context cancellation error; err=%s", err)
		}
	})

	t.Run("successfully errors on timeout", func(t *testing.T) {
		k := &KubeClient{
			cli:        kfake.NewSimpleClientset(),
			instanceID: "test",
		}

		podSpec := &v1.Pod{
			ObjectMeta: metav1.ObjectMeta{Name: "test", Namespace: defaultNamespace},
			Spec: v1.PodSpec{
				Containers: []v1.Container{
					{Name: "test-pod", Image: "containous/whoami"},
				},
			},
		}

		pod, err := k.cli.CoreV1().Pods(defaultNamespace).Create(t.Context(), podSpec, metav1.CreateOptions{})
		if err != nil {
			t.Errorf("failed to create pod; err=%s", err)
		}
		defer func() {
			err := k.cli.CoreV1().Pods(defaultNamespace).Delete(t.Context(), pod.Name, metav1.DeleteOptions{})
			require.NoError(t, err)
		}()

		ctx, cancelFunc := context.WithTimeout(t.Context(), 0*time.Second)
		defer cancelFunc()

		err = k.waitForPodStatus(ctx, v1.PodRunning, podSpec)
		if !errors.Is(err, context.DeadlineExceeded) {
			t.Errorf("waitForPodStatus should throw deadline exceeded error; err=%s", err)
		}
	})

}
