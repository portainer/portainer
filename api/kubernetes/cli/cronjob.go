package cli

import (
	"context"
	"strings"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/internal/errorlist"
	batchv1 "k8s.io/api/batch/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetCronJobs returns all cronjobs in the given namespace
// If the user is a kube admin, it returns all cronjobs in the namespace
// Otherwise, it returns only the cronjobs in the non-admin namespaces
func (kcl *KubeClient) GetCronJobs(namespace string) ([]models.K8sCronJob, error) {
	if kcl.GetIsKubeAdmin() {
		return kcl.fetchCronJobs(namespace)
	}

	return kcl.fetchCronJobsForNonAdmin(namespace)
}

// fetchCronJobsForNonAdmin returns all cronjobs in the given namespace
// It returns only the cronjobs in the non-admin namespaces
func (kcl *KubeClient) fetchCronJobsForNonAdmin(namespace string) ([]models.K8sCronJob, error) {
	cronJobs, err := kcl.fetchCronJobs(namespace)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sCronJob, 0)
	for _, cronJob := range cronJobs {
		if _, ok := nonAdminNamespaceSet[cronJob.Namespace]; ok {
			results = append(results, cronJob)
		}
	}

	return results, nil
}

// fetchCronJobs returns all cronjobs in the given namespace
// It returns all cronjobs in the namespace
func (kcl *KubeClient) fetchCronJobs(namespace string) ([]models.K8sCronJob, error) {
	cronJobs, err := kcl.cli.BatchV1().CronJobs(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	jobs, err := kcl.cli.BatchV1().Jobs(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := make([]models.K8sCronJob, 0)
	for _, cronJob := range cronJobs.Items {
		results = append(results, kcl.parseCronJob(cronJob, jobs))
	}

	return results, nil
}

// parseCronJob converts a batchv1.CronJob object to a models.K8sCronJob object.
func (kcl *KubeClient) parseCronJob(cronJob batchv1.CronJob, jobsList *batchv1.JobList) models.K8sCronJob {
	jobs, err := kcl.getCronJobExecutions(cronJob.Name, jobsList)
	if err != nil {
		return models.K8sCronJob{}
	}

	timezone := "<none>"
	if cronJob.Spec.TimeZone != nil {
		timezone = *cronJob.Spec.TimeZone
	}

	suspend := false
	if cronJob.Spec.Suspend != nil {
		suspend = *cronJob.Spec.Suspend
	}

	return models.K8sCronJob{
		Id:        string(cronJob.UID),
		Name:      cronJob.Name,
		Namespace: cronJob.Namespace,
		Command:   strings.Join(cronJob.Spec.JobTemplate.Spec.Template.Spec.Containers[0].Command, " "),
		Schedule:  cronJob.Spec.Schedule,
		Timezone:  timezone,
		Suspend:   suspend,
		Jobs:      jobs,
		IsSystem:  kcl.isSystemCronJob(cronJob.Namespace),
	}
}

func (kcl *KubeClient) isSystemCronJob(namespace string) bool {
	return kcl.isSystemNamespace(namespace)
}

// DeleteCronJobs deletes the provided list of cronjobs in its namespace
// it returns an error if any of the cronjobs are not found or if there is an error deleting the cronjobs
func (kcl *KubeClient) DeleteCronJobs(payload models.K8sCronJobDeleteRequests) error {
	var errors []error
	for namespace := range payload {
		for _, cronJobName := range payload[namespace] {
			client := kcl.cli.BatchV1().CronJobs(namespace)

			_, err := client.Get(context.Background(), cronJobName, metav1.GetOptions{})
			if err != nil {
				if k8serrors.IsNotFound(err) {
					continue
				}

				errors = append(errors, err)
			}

			if err := client.Delete(context.Background(), cronJobName, metav1.DeleteOptions{}); err != nil {
				errors = append(errors, err)
			}
		}
	}

	return errorlist.Combine(errors)
}
