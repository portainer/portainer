package cli

import (
	"context"
	"testing"
	"time"

	models "github.com/portainer/portainer/api/http/models/kubernetes"

	"github.com/stretchr/testify/require"
	batchv1 "k8s.io/api/batch/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

// TestFetchJobs tests the fetchJobs method for both admin and non-admin clients
// It creates a fake Kubernetes client and passes it to the fetchJobs method
// It then logs the fetched jobs
// non-admin client will have access to the default namespace only
func (kcl *KubeClient) TestFetchJobs(t *testing.T) {
	t.Run("admin client can fetch jobs from all namespaces", func(t *testing.T) {
		kcl.cli = kfake.NewSimpleClientset()
		kcl.instanceID = "test"
		kcl.isKubeAdmin = true

		jobs, err := kcl.GetJobs("", false)
		if err != nil {
			t.Fatalf("Failed to fetch jobs: %v", err)
		}

		t.Logf("Fetched jobs: %v", jobs)
	})

	t.Run("non-admin client can fetch jobs from the default namespace only", func(t *testing.T) {
		kcl.cli = kfake.NewSimpleClientset()
		kcl.instanceID = "test"
		kcl.isKubeAdmin = false
		kcl.SetClientNonAdminNamespaces([]string{"default"})

		jobs, err := kcl.GetJobs("", false)
		if err != nil {
			t.Fatalf("Failed to fetch jobs: %v", err)
		}

		t.Logf("Fetched jobs: %v", jobs)
	})

	t.Run("delete jobs", func(t *testing.T) {
		kcl.cli = kfake.NewSimpleClientset()
		kcl.instanceID = "test"

		_, err := kcl.cli.BatchV1().Jobs("default").Create(context.Background(), &batchv1.Job{
			ObjectMeta: metav1.ObjectMeta{Name: "test-job"},
		}, metav1.CreateOptions{})
		if err != nil {
			t.Fatalf("Failed to create job: %v", err)
		}

		err = kcl.DeleteJobs(models.K8sJobDeleteRequests{
			"default": []string{"test-job"},
		})

		if err != nil {
			t.Fatalf("Failed to delete jobs: %v", err)
		}
	})
}

func TestParseJobTimes(t *testing.T) {
	// Empty job
	jobTimes := parseJobTimes(batchv1.Job{})

	require.Equal(t, "N/A", jobTimes.duration)
	require.Equal(t, "N/A", jobTimes.start)
	require.Equal(t, "N/A", jobTimes.finish)

	// Full job
	now := time.Now()
	completionTime := now.Add(10 * time.Minute)

	jobTimes = parseJobTimes(batchv1.Job{
		Status: batchv1.JobStatus{
			StartTime:      &metav1.Time{Time: now},
			CompletionTime: &metav1.Time{Time: completionTime},
		},
	})

	require.Equal(t, "10m0s", jobTimes.duration)
	require.Equal(t, now.Format(time.RFC3339), jobTimes.start)
	require.Equal(t, completionTime.Format(time.RFC3339), jobTimes.finish)
}
