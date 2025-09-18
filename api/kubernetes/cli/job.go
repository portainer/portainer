package cli

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/portainer/portainer/api/internal/errorlist"
	"github.com/rs/zerolog/log"
	batchv1 "k8s.io/api/batch/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// GetJobs returns all jobs in the given namespace
// If the user is a kube admin, it returns all jobs in the namespace
// Otherwise, it returns only the jobs in the non-admin namespaces
func (kcl *KubeClient) GetJobs(namespace string, includeCronJobChildren bool) ([]models.K8sJob, error) {
	if kcl.GetIsKubeAdmin() {
		return kcl.fetchJobs(namespace, includeCronJobChildren)
	}

	return kcl.fetchJobsForNonAdmin(namespace, includeCronJobChildren)
}

// fetchJobsForNonAdmin returns all jobs in the given namespace
// It returns only the jobs in the non-admin namespaces
func (kcl *KubeClient) fetchJobsForNonAdmin(namespace string, includeCronJobChildren bool) ([]models.K8sJob, error) {
	jobs, err := kcl.fetchJobs(namespace, includeCronJobChildren)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sJob, 0)
	for _, job := range jobs {
		if _, ok := nonAdminNamespaceSet[job.Namespace]; ok {
			results = append(results, job)
		}
	}

	return results, nil
}

// fetchJobs returns all jobs in the given namespace
// It returns all jobs in the namespace
func (kcl *KubeClient) fetchJobs(namespace string, includeCronJobChildren bool) ([]models.K8sJob, error) {
	jobs, err := kcl.cli.BatchV1().Jobs(namespace).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := make([]models.K8sJob, 0)
	for _, job := range jobs.Items {
		if !includeCronJobChildren && checkCronJobOwner(job) {
			continue
		}

		results = append(results, kcl.parseJob(job))
	}

	return results, nil
}

// checkCronJobOwner checks if the job has a cronjob owner
// it returns true if the job has a cronjob owner
// otherwise, it returns false
func checkCronJobOwner(job batchv1.Job) bool {
	for _, owner := range job.OwnerReferences {
		if owner.Kind == "CronJob" {
			return true
		}
	}

	return false
}

// parseJob converts a batchv1.Job object to a models.K8sJob object.
func (kcl *KubeClient) parseJob(job batchv1.Job) models.K8sJob {
	times := parseJobTimes(job)
	status, failedReason := determineJobStatus(job)
	podName := getJobPodName(kcl, job)

	return models.K8sJob{
		ID:           string(job.UID),
		Namespace:    job.Namespace,
		Name:         job.Name,
		PodName:      podName,
		Command:      strings.Join(job.Spec.Template.Spec.Containers[0].Command, " "),
		Container:    job.Spec.Template.Spec.Containers[0],
		BackoffLimit: *job.Spec.BackoffLimit,
		Completions:  *job.Spec.Completions,
		StartTime:    times.start,
		FinishTime:   times.finish,
		Duration:     times.duration,
		Status:       status,
		FailedReason: failedReason,
		IsSystem:     kcl.isSystemJob(job.Namespace),
	}
}

func (kcl *KubeClient) isSystemJob(namespace string) bool {
	return kcl.isSystemNamespace(namespace)
}

type jobTimes struct {
	start    string
	finish   string
	duration string
}

func parseJobTimes(job batchv1.Job) jobTimes {
	times := jobTimes{
		start:    "N/A",
		finish:   "N/A",
		duration: "N/A",
	}

	st := job.Status.StartTime
	if st == nil {
		return times
	}

	times.start = st.Format(time.RFC3339)
	times.duration = time.Since(st.Time).Truncate(time.Minute).String()

	if ct := job.Status.CompletionTime; ct != nil {
		times.finish = ct.Format(time.RFC3339)
		times.duration = ct.Time.Sub(st.Time).String()
	}

	return times
}

func determineJobStatus(job batchv1.Job) (status, failedReason string) {
	failedReason = "N/A"

	switch {
	case job.Status.Failed > 0:
		return "Failed", getLatestJobCondition(job.Status.Conditions)
	case job.Status.Succeeded > 0:
		return "Succeeded", failedReason
	case job.Status.Active == 0:
		return "Completed", failedReason
	default:
		return "Running", failedReason
	}
}

func getJobPodName(kcl *KubeClient, job batchv1.Job) string {
	pod, err := kcl.getLatestJobPod(job.Namespace, job.Name)
	if err != nil {
		log.Warn().Err(err).
			Str("job", job.Name).
			Str("namespace", job.Namespace).
			Msg("Failed to get latest job pod")
		return ""
	}

	if pod != nil {
		return pod.Name
	}
	return ""
}

// getCronJobExecutions returns the jobs for a given cronjob
// it returns the jobs for the cronjob
func (kcl *KubeClient) getCronJobExecutions(cronJobName string, jobs *batchv1.JobList) ([]models.K8sJob, error) {
	maxItems := 5

	results := make([]models.K8sJob, 0)
	for _, job := range jobs.Items {
		for _, owner := range job.OwnerReferences {
			if owner.Kind == "CronJob" && owner.Name == cronJobName {
				results = append(results, kcl.parseJob(job))

				if len(results) >= maxItems {
					return results, nil
				}
			}
		}
	}

	return results, nil
}

// DeleteJobs deletes the provided list of jobs
// it returns an error if any of the jobs are not found or if there is an error deleting the jobs
func (kcl *KubeClient) DeleteJobs(payload models.K8sJobDeleteRequests) error {
	var errors []error
	for namespace := range payload {
		for _, jobName := range payload[namespace] {
			client := kcl.cli.BatchV1().Jobs(namespace)

			_, err := client.Get(context.Background(), jobName, metav1.GetOptions{})
			if err != nil {
				if k8serrors.IsNotFound(err) {
					continue
				}

				errors = append(errors, err)
			}

			if err := client.Delete(context.Background(), jobName, metav1.DeleteOptions{}); err != nil {
				errors = append(errors, err)
			}
		}
	}

	return errorlist.Combine(errors)
}

// getLatestJobCondition returns the latest condition of the job
// it returns the latest condition of the job
// this is only used for the failed reason
func getLatestJobCondition(conditions []batchv1.JobCondition) string {
	if len(conditions) == 0 {
		return "No conditions"
	}

	sort.Slice(conditions, func(i, j int) bool {
		return conditions[i].LastTransitionTime.After(conditions[j].LastTransitionTime.Time)
	})

	latest := conditions[0]
	return fmt.Sprintf("%s: %s", latest.Type, latest.Message)
}
