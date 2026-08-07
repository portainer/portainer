package kubernetes

import (
	"errors"
	"fmt"
	"net/http"
)

type (
	// K8sDeploymentWriteRequest is the payload for creating or updating a deployment.
	// The namespace comes from the request route rather than the payload.
	//
	// It models the fields the deployment forms drive and no more. On update it is
	// merged onto the live deployment, so everything it leaves out (update strategy,
	// affinity, tolerations, security contexts, ...) is preserved, and a nil field
	// leaves the live value untouched while a non-nil one replaces it wholesale.
	K8sDeploymentWriteRequest struct {
		Name        string            `json:"name"`
		Labels      map[string]string `json:"labels,omitempty"`
		Annotations map[string]string `json:"annotations,omitempty"`
		Replicas    *int32            `json:"replicas,omitempty"`
		// Selector matches the pods this deployment owns. It is immutable once the
		// deployment exists, so it is only read on create.
		Selector map[string]string `json:"selector,omitempty"`
		Pod      *K8sPodTemplate   `json:"pod,omitempty"`
	}

	// K8sPodTemplate describes the pods a deployment creates.
	K8sPodTemplate struct {
		Labels      map[string]string `json:"labels,omitempty"`
		Annotations map[string]string `json:"annotations,omitempty"`
		Containers  []K8sContainer    `json:"containers"`
		Volumes     []K8sPodVolume    `json:"volumes,omitempty"`
	}

	K8sContainer struct {
		Name            string                   `json:"name"`
		Image           string                   `json:"image"`
		ImagePullPolicy string                   `json:"imagePullPolicy,omitempty"`
		Command         []string                 `json:"command,omitempty"`
		Args            []string                 `json:"args,omitempty"`
		WorkingDir      string                   `json:"workingDir,omitempty"`
		Ports           []K8sContainerPort       `json:"ports,omitempty"`
		Env             []K8sEnvVar              `json:"env,omitempty"`
		Resources       *K8sResourceRequirements `json:"resources,omitempty"`
		VolumeMounts    []K8sVolumeMount         `json:"volumeMounts,omitempty"`
		// EnvFromSecrets names secrets whose keys are all exposed as environment
		// variables.
		EnvFromSecrets []string `json:"envFromSecrets,omitempty"`
	}

	K8sContainerPort struct {
		Name          string `json:"name,omitempty"`
		ContainerPort int32  `json:"containerPort"`
		Protocol      string `json:"protocol,omitempty"`
	}

	// K8sEnvVar holds an environment variable given either literally or as a reference
	// to a key of a secret.
	K8sEnvVar struct {
		Name      string           `json:"name"`
		Value     string           `json:"value,omitempty"`
		SecretRef *K8sSecretKeyRef `json:"secretRef,omitempty"`
	}

	K8sSecretKeyRef struct {
		Name string `json:"name"`
		Key  string `json:"key"`
	}

	// K8sResourceRequirements holds compute resources as the quantity strings the
	// Kubernetes API uses, such as "500m" or "1Gi". Keys beyond cpu and memory, a GPU
	// vendor key for instance, are passed through untouched.
	K8sResourceRequirements struct {
		Requests map[string]string `json:"requests,omitempty"`
		Limits   map[string]string `json:"limits,omitempty"`
	}

	K8sVolumeMount struct {
		Name      string `json:"name"`
		MountPath string `json:"mountPath"`
		SubPath   string `json:"subPath,omitempty"`
		ReadOnly  bool   `json:"readOnly,omitempty"`
	}

	// K8sPodVolume mounts a persistent volume claim into the pod. Claims are the only
	// volume kind these deployments use.
	K8sPodVolume struct {
		Name      string `json:"name"`
		ClaimName string `json:"claimName"`
	}

	// K8sDeploymentScaleRequest sets the desired replica count of a deployment.
	K8sDeploymentScaleRequest struct {
		Replicas *int32 `json:"replicas"`
	}

	// K8sDeploymentPatchRequest adds or overwrites annotations on a deployment and on
	// the pods it creates. Existing annotations that the payload does not name are kept,
	// which is what protects the server-managed ones such as the revision counter.
	// Changing a pod annotation rolls the workload, the mechanism behind a rollout
	// restart.
	K8sDeploymentPatchRequest struct {
		Annotations    map[string]string `json:"annotations,omitempty"`
		PodAnnotations map[string]string `json:"podAnnotations,omitempty"`
	}

	// K8sDeploymentRollbackRequest rolls a deployment back to an earlier revision. A
	// revision of 0 selects the one immediately before the current, matching the
	// behaviour of kubectl rollout undo.
	K8sDeploymentRollbackRequest struct {
		Revision int64 `json:"revision,omitempty"`
	}
)

func (r *K8sDeploymentWriteRequest) Validate(*http.Request) error {
	if r.Name == "" {
		return errors.New("missing deployment name from the request payload")
	}

	if r.Pod == nil {
		return nil
	}

	if len(r.Pod.Containers) == 0 {
		return errors.New("a pod template must declare at least one container")
	}

	for i, container := range r.Pod.Containers {
		if container.Name == "" {
			return fmt.Errorf("missing name for the container at index %d", i)
		}

		if container.Image == "" {
			return fmt.Errorf("missing image for container %q", container.Name)
		}
	}

	return nil
}

// ValidateForCreate checks the fields a new deployment cannot be created without. They
// are optional on update, where the live deployment already supplies them, so they sit
// outside Validate and the create handler calls this as well.
func (r *K8sDeploymentWriteRequest) ValidateForCreate() error {
	if len(r.Selector) == 0 {
		return errors.New("missing selector from the request payload")
	}

	if r.Pod == nil {
		return errors.New("missing pod template from the request payload")
	}

	return nil
}

func (r *K8sDeploymentScaleRequest) Validate(*http.Request) error {
	if r.Replicas == nil {
		return errors.New("missing replicas from the request payload")
	}

	if *r.Replicas < 0 {
		return errors.New("replicas cannot be negative")
	}

	return nil
}

func (r *K8sDeploymentPatchRequest) Validate(*http.Request) error {
	if len(r.Annotations) == 0 && len(r.PodAnnotations) == 0 {
		return errors.New("the request payload must carry at least one annotation to apply")
	}

	return nil
}

func (r *K8sDeploymentRollbackRequest) Validate(*http.Request) error {
	if r.Revision < 0 {
		return errors.New("revision cannot be negative")
	}

	return nil
}
