package cli

import (
	"context"
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	batchv1 "k8s.io/api/batch/v1"
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

		_, err := kcl.cli.BatchV1().CronJobs("default").Create(context.Background(), &batchv1.CronJob{
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
