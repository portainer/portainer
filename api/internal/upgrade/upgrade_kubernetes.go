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
)

func int32Ptr(i int32) *int32 { return &i }

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

	job, err := jobsCli.Create(ctx, &batchv1.Job{
		ObjectMeta: metav1.ObjectMeta{
			Name:      taskName,
			Namespace: namespace,
		},

		Spec: batchv1.JobSpec{
			BackoffLimit: int32Ptr(0),
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

	i, err := jobsCli.Watch(ctx, metav1.ListOptions{
		FieldSelector: "metadata.name=" + taskName,
	})
	if err != nil {
		return errors.WithMessage(err, "failed to watch upgrade job")
	}

	for event := range i.ResultChan() {
		job, ok := event.Object.(*batchv1.Job)
		if !ok {
			continue
		}

		if job.Status.Succeeded > 0 {
			break
		}

		if job.Status.Failed > 0 {
			return errors.New("upgrade failed")
		}

	}

	log.Debug().
		Str("job", job.Name).
		Msg("Upgrade job created")

	return errors.New("upgrade failed: server should have been restarted by the updater")

}
