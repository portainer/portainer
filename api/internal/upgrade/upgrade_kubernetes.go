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
	"k8s.io/client-go/kubernetes"
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

	if err := service.checkImageForKubernetes(ctx, kubeCLI, namespace, image); err != nil {
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

func (service *service) checkImageForKubernetes(ctx context.Context, kubeCLI *kubernetes.Clientset, namespace, image string) error {
	podsCli := kubeCLI.CoreV1().Pods(namespace)

	log.Debug().
		Str("image", image).
		Msg("Checking image")

	podName := fmt.Sprintf("portainer-image-check-%d", time.Now().Unix())
	_, err := podsCli.Create(ctx, &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name: podName,
		},
		Spec: corev1.PodSpec{
			RestartPolicy: "Never",

			Containers: []corev1.Container{
				{
					Name:  fmt.Sprint(podName, "-container"),
					Image: image,
				},
			},
		},
	}, metav1.CreateOptions{})

	if err != nil {
		log.Warn().Err(err).Msg("failed to create image check pod")
		return errors.WithMessage(err, "failed to create image check pod")
	}

	defer func() {
		log.Debug().
			Str("pod", podName).
			Msg("Deleting image check pod")

		if err := podsCli.Delete(ctx, podName, metav1.DeleteOptions{}); err != nil {
			log.Warn().Err(err).Msg("failed to delete image check pod")
		}
	}()

	i := 0
	for {
		time.Sleep(2 * time.Second)

		log.Debug().
			Str("image", image).
			Int("try", i).
			Msg("Checking image")

		i++

		pod, err := podsCli.Get(ctx, podName, metav1.GetOptions{})
		if err != nil {
			return errors.WithMessage(err, "failed to get image check pod")
		}

		for _, containerStatus := range pod.Status.ContainerStatuses {
			if containerStatus.Ready {
				log.Debug().
					Str("image", image).
					Str("pod", podName).
					Msg("Image check container ready, assuming image is available")

				return nil
			}

			if containerStatus.State.Waiting != nil {
				if containerStatus.State.Waiting.Reason == "ErrImagePull" || containerStatus.State.Waiting.Reason == "ImagePullBackOff" {
					log.Debug().
						Str("image", image).
						Str("pod", podName).
						Str("reason", containerStatus.State.Waiting.Reason).
						Str("message", containerStatus.State.Waiting.Message).
						Str("container", containerStatus.Name).
						Msg("Image check container failed because of missing image")
					return fmt.Errorf("image %s not found", image)
				}
			}
		}
	}
}
