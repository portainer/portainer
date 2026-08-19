package cli

import (
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

// TestFetchCronJobs tests the fetchCronJobs method for both admin and non-admin clients
// It creates a fake Kubernetes client and passes it to the fetchCronJobs method
// It then logs the fetched Cron Jobs
// non-admin client will have access to the default namespace only
func (kcl *KubeClient) TestFetchCronJobs(t *testing.T) {
	t.Run("admin client can fetch Cron Jobs from all namespaces", func(t *testing.T) {
		kcl.cli = kfake.NewSimpleClientset()
		kcl.instanceID = "test"
		kcl.isKubeAdmin = true

		cronJobs, err := kcl.GetCronJobs("")
		if err != nil {
			t.Fatalf("Failed to fetch Cron Jobs: %v", err)
		}

		t.Logf("Fetched Cron Jobs: %v", cronJobs)
	})

	t.Run("non-admin client can fetch Cron Jobs from the default namespace only", func(t *testing.T) {
		kcl.cli = kfake.NewSimpleClientset()
		kcl.instanceID = "test"
		kcl.isKubeAdmin = false
		kcl.SetClientNonAdminNamespaces([]string{"default"})

		cronJobs, err := kcl.GetCronJobs("")
		if err != nil {
			t.Fatalf("Failed to fetch Cron Jobs: %v", err)
		}

		t.Logf("Fetched Cron Jobs: %v", cronJobs)
	})

	t.Run("delete Cron Jobs", func(t *testing.T) {
		kcl.cli = kfake.NewSimpleClientset()
		kcl.instanceID = "test"

		_, err := kcl.cli.BatchV1().CronJobs("default").Create(t.Context(), &batchv1.CronJob{
			ObjectMeta: metav1.ObjectMeta{Name: "test-cronjob"},
		}, metav1.CreateOptions{})
		if err != nil {
			t.Fatalf("Failed to create cron job: %v", err)
		}

		err = kcl.DeleteCronJobs(models.K8sCronJobDeleteRequests{
			"default": []string{"test-cronjob"},
		})

		if err != nil {
			t.Fatalf("Failed to delete Cron Jobs: %v", err)
		}

		t.Logf("Deleted Cron Jobs")
	})
}

// TestGetCronJobExecutionsNamespaceFilter verifies that getCronJobExecutions only returns
// executions belonging to the CronJob's own namespace, even when same-named CronJobs
// exist across multiple namespaces.
func TestGetCronJobExecutionsNamespaceFilter(t *testing.T) {
	t.Parallel()
	backoffLimit := int32(3)
	completions := int32(1)

	makeJob := func(name, namespace, cronJobName string) batchv1.Job {
		return batchv1.Job{
			ObjectMeta: metav1.ObjectMeta{
				Name:      name,
				Namespace: namespace,
				OwnerReferences: []metav1.OwnerReference{
					{Kind: "CronJob", Name: cronJobName},
				},
			},
			Spec: batchv1.JobSpec{
				BackoffLimit: &backoffLimit,
				Completions:  &completions,
				Template: corev1.PodTemplateSpec{
					Spec: corev1.PodSpec{
						Containers: []corev1.Container{{Name: "worker", Image: "busybox"}},
					},
				},
			},
		}
	}

	// Simulate the cross-namespace job list returned when fetchCronJobs is called with namespace=""
	allJobs := &batchv1.JobList{
		Items: []batchv1.Job{
			makeJob("backup-prod-28001440", "ns-prod", "backup"),
			makeJob("backup-test-28001441", "ns-test", "backup"),
		},
	}

	kcl := &KubeClient{
		cli:         kfake.NewSimpleClientset(),
		instanceID:  "test",
		isKubeAdmin: true,
	}

	t.Run("returns only executions from the matching namespace", func(t *testing.T) {
		result, err := kcl.getCronJobExecutions("backup", "ns-prod", allJobs)
		require.NoError(t, err)
		require.Len(t, result, 1)
		assert.Equal(t, "ns-prod", result[0].Namespace)
		assert.Equal(t, "backup-prod-28001440", result[0].Name)
	})

	t.Run("returns only executions from the other matching namespace", func(t *testing.T) {
		result, err := kcl.getCronJobExecutions("backup", "ns-test", allJobs)
		require.NoError(t, err)
		require.Len(t, result, 1)
		assert.Equal(t, "ns-test", result[0].Namespace)
		assert.Equal(t, "backup-test-28001441", result[0].Name)
	})
}
