package upgrade

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/rs/zerolog/log"
	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	v1 "k8s.io/client-go/kubernetes/typed/batch/v1"
)

func ptr[T any](i T) *T { return &i }

func (service *service) upgradeKubernetes(environment *portainer.Endpoint, licenseKey, version string) error {
	ctx := context.TODO()

	kubeCLI, err := service.kubernetesClientFactory.CreateClient(environment)
	if err != nil {
		return errors.WithMessage(err, "failed to get kubernetes client")
	}

	namespace := "portainer"
	taskName := fmt.Sprintf("portainer-upgrade-%d", time.Now().Unix())

	jobsCli := kubeCLI.BatchV1().Jobs(namespace)

	updaterImage := os.Getenv(updaterImageEnvVar)
	if updaterImage == "" {
		updaterImage = "portainer/portainer-updater:latest"
	}

	portainerImagePrefix := os.Getenv(portainerImagePrefixEnvVar)
	if portainerImagePrefix == "" {
		portainerImagePrefix = "portainer/portainer-ee"
	}

	image := fmt.Sprintf("%s:%s", portainerImagePrefix, version)

	if err := service.checkImageForKubernetes(ctx, jobsCli, image); err != nil {
		return err
	}

	job, err := jobsCli.Create(ctx, &batchv1.Job{
		ObjectMeta: metav1.ObjectMeta{
			Name:      taskName,
			Namespace: namespace,
		},

		Spec: batchv1.JobSpec{
			TTLSecondsAfterFinished: ptr[int32](5 * 60), // cleanup after 5 minutes
			BackoffLimit:            ptr[int32](0),
			Template: corev1.PodTemplateSpec{
				Spec: corev1.PodSpec{

					RestartPolicy:      "Never",
					ServiceAccountName: "portainer-sa-clusteradmin",
					Containers: []corev1.Container{
						{
							Name:  taskName,
							Image: updaterImage,
							Args: []string{
								"--pretty-log",
								"--log-level", "DEBUG",
								"portainer",
								"--env-type", "kubernetes",
								"--image", image,
								"--license", licenseKey,
							},
						},
					},
				},
			},
		},
	}, metav1.CreateOptions{})

	if err != nil {
		return errors.WithMessage(err, "failed to create upgrade job")
	}

	watcher, err := jobsCli.Watch(ctx, metav1.ListOptions{
		FieldSelector:  "metadata.name=" + taskName,
		TimeoutSeconds: ptr[int64](60),
	})
	if err != nil {
		return errors.WithMessage(err, "failed to watch upgrade job")
	}

	for event := range watcher.ResultChan() {
		job, ok := event.Object.(*batchv1.Job)
		if !ok {
			continue
		}

		for _, c := range job.Status.Conditions {
			if c.Type == batchv1.JobComplete {
				log.Debug().
					Str("job", job.Name).
					Msg("Upgrade job completed")
				return nil
			}

			if c.Type == batchv1.JobFailed {
				return fmt.Errorf("upgrade failed: %s", c.Message)
			}
		}
	}

	log.Debug().
		Str("job", job.Name).
		Msg("Upgrade job created")

	return errors.New("upgrade failed: server should have been restarted by the updater")

}

func (service *service) checkImageForKubernetes(ctx context.Context, jobsCli v1.JobInterface, image string) error {
	job, err := jobsCli.Create(ctx, &batchv1.Job{
		ObjectMeta: metav1.ObjectMeta{
			Name: "portainer-upgrade-image-check",
		},
		Spec: batchv1.JobSpec{
			TTLSecondsAfterFinished: ptr[int32](5 * 60), // cleanup after 5 minutes
			BackoffLimit:            ptr[int32](0),
			Template: corev1.PodTemplateSpec{
				Spec: corev1.PodSpec{
					RestartPolicy: "Never",
					Containers: []corev1.Container{
						{
							Name:  "portainer-upgrade-image-check",
							Image: image,
						},
					},
				},
			},
		},
	}, metav1.CreateOptions{})
	if err != nil {
		return errors.WithMessage(err, "failed to create image check job")
	}

	watcher, err := jobsCli.Watch(ctx, metav1.ListOptions{
		FieldSelector:  "metadata.name=" + job.Name,
		TimeoutSeconds: ptr[int64](60),
	})
	if err != nil {
		return errors.WithMessage(err, "failed to watch image check job")
	}

	for event := range watcher.ResultChan() {
		job, ok := event.Object.(*batchv1.Job)
		if !ok {
			continue
		}

		for _, c := range job.Status.Conditions {
			if c.Type == batchv1.JobComplete {
				log.Debug().
					Str("job", job.Name).
					Msg("image check completed")

				return nil
			}

			if c.Type == batchv1.JobFailed {
				return fmt.Errorf("image check failed: %s", c.Message)
			}
		}
	}

	return errors.New("image check failed")

}
