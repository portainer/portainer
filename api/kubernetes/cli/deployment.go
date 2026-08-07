package cli

import (
	"context"
	"fmt"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	labels "k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/types"
)

// lastAppliedConfigAnnotation holds the full previous manifest that kubectl writes
// on apply; it can be several KB and is not needed by API consumers, so it is
// stripped from read responses.
const lastAppliedConfigAnnotation = "kubectl.kubernetes.io/last-applied-configuration"

// GetDeployment returns a deployment trimmed for read consumers. The full pod
// template, spec, status and resourceVersion are preserved (so an edit form can be
// reconstructed, readiness read, and the workload updated), while server-managed
// and heavy fields (managed fields, last-applied-config annotation) are removed to
// keep the response small.
func (kcl *KubeClient) GetDeployment(namespace, name string) (*appsv1.Deployment, error) {
	deployment, err := kcl.cli.AppsV1().Deployments(namespace).Get(context.TODO(), name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	trimDeploymentForRead(deployment)
	// Typed Get leaves TypeMeta empty; set it so consumers can rely on Kind.
	deployment.TypeMeta = metav1.TypeMeta{Kind: "Deployment", APIVersion: "apps/v1"}

	return deployment, nil
}

// GetDeployments lists deployments in the given namespace (or all namespaces when
// empty), optionally narrowed by labelSelector and fieldSelector. Each item is
// trimmed for read consumers like GetDeployment.
// if the user is an admin, all matching deployments are fetched.
// otherwise, namespaces the non-admin user has access to are used to filter them.
func (kcl *KubeClient) GetDeployments(namespace string, opts models.K8sResourceListOptions) ([]appsv1.Deployment, error) {
	if kcl.GetIsKubeAdmin() {
		return kcl.getDeployments(namespace, opts)
	}

	return kcl.getDeploymentsForNonAdmin(namespace, opts)
}

// getDeploymentsForNonAdmin fetches the deployments in the namespaces the user has
// access to. This function is called when the user is not an admin.
func (kcl *KubeClient) getDeploymentsForNonAdmin(namespace string, opts models.K8sResourceListOptions) ([]appsv1.Deployment, error) {
	if len(kcl.GetClientNonAdminNamespaces()) == 0 {
		return nil, nil
	}

	deployments, err := kcl.getDeployments(namespace, opts)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := []appsv1.Deployment{}
	for _, deployment := range deployments {
		if _, ok := nonAdminNamespaceSet[deployment.Namespace]; ok {
			results = append(results, deployment)
		}
	}

	return results, nil
}

func (kcl *KubeClient) getDeployments(namespace string, opts models.K8sResourceListOptions) ([]appsv1.Deployment, error) {
	list, err := kcl.cli.AppsV1().Deployments(namespace).List(context.TODO(), metav1.ListOptions{
		LabelSelector: opts.LabelSelector,
		FieldSelector: opts.FieldSelector,
	})
	if err != nil {
		return nil, err
	}

	results := make([]appsv1.Deployment, 0, len(list.Items))
	for i := range list.Items {
		trimDeploymentForRead(&list.Items[i])
		// Typed List leaves TypeMeta empty; set it so consumers can rely on Kind.
		list.Items[i].TypeMeta = metav1.TypeMeta{Kind: "Deployment", APIVersion: "apps/v1"}
		results = append(results, list.Items[i])
	}

	return results, nil
}

// trimDeploymentForRead removes server-managed and heavy fields that read
// consumers do not need, keeping the spec, status, metadata and resourceVersion intact.
func trimDeploymentForRead(deployment *appsv1.Deployment) {
	deployment.ManagedFields = nil
	delete(deployment.Annotations, lastAppliedConfigAnnotation)
}

// HasStackName checks whether the given name is used in the given namespace.
func (kcl *KubeClient) HasStackName(namespace string, stackName string) (bool, error) {
	querySet := labels.Set{"io.portainer.kubernetes.application.stack": stackName}
	listOpts := metav1.ListOptions{LabelSelector: labels.SelectorFromSet(querySet).String()}
	list, err := kcl.cli.AppsV1().Deployments(namespace).List(context.TODO(), listOpts)
	if err != nil {
		return false, err
	}
	if len(list.Items) > 0 {
		return false, nil
	}
	return true, nil
}

// CreateDeployment creates a deployment in the given namespace from the write request.
// The returned deployment is trimmed the same way the read endpoints trim theirs.
func (kcl *KubeClient) CreateDeployment(namespace string, request models.K8sDeploymentWriteRequest) (*appsv1.Deployment, error) {
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:        request.Name,
			Namespace:   namespace,
			Labels:      request.Labels,
			Annotations: request.Annotations,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: request.Replicas,
			Selector: &metav1.LabelSelector{MatchLabels: request.Selector},
			Template: buildPodTemplate(request.Pod),
		},
	}

	created, err := kcl.cli.AppsV1().Deployments(namespace).Create(context.TODO(), deployment, metav1.CreateOptions{})
	if err != nil {
		return nil, err
	}

	return prepareDeploymentForRead(created), nil
}

// UpdateDeployment applies the write request to an existing deployment. The live
// deployment is read first and only the fields the request models are replaced, so
// everything it cannot express - update strategy, affinity, tolerations, security
// contexts - survives the update. The selector is immutable and therefore ignored.
func (kcl *KubeClient) UpdateDeployment(namespace string, request models.K8sDeploymentWriteRequest) (*appsv1.Deployment, error) {
	deployment, err := kcl.cli.AppsV1().Deployments(namespace).Get(context.TODO(), request.Name, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	if request.Labels != nil {
		deployment.Labels = request.Labels
	}
	if request.Annotations != nil {
		deployment.Annotations = request.Annotations
	}
	if request.Replicas != nil {
		deployment.Spec.Replicas = request.Replicas
	}
	if request.Pod != nil {
		applyPodTemplate(&deployment.Spec.Template, request.Pod)
	}

	updated, err := kcl.cli.AppsV1().Deployments(namespace).Update(context.TODO(), deployment, metav1.UpdateOptions{})
	if err != nil {
		return nil, err
	}

	return prepareDeploymentForRead(updated), nil
}

// ScaleDeployment sets the desired replica count of a deployment.
func (kcl *KubeClient) ScaleDeployment(namespace, name string, replicas int32) (*appsv1.Deployment, error) {
	patch := fmt.Appendf(nil, `{"spec":{"replicas":%d}}`, replicas)

	scaled, err := kcl.cli.AppsV1().Deployments(namespace).Patch(context.TODO(), name, types.StrategicMergePatchType, patch, metav1.PatchOptions{})
	if err != nil {
		return nil, err
	}

	return prepareDeploymentForRead(scaled), nil
}

// PatchDeployment adds or overwrites annotations on a deployment and on the pods it
// creates. Annotations the request does not name are left in place, which is what keeps
// the server-managed ones such as the revision counter intact.
func (kcl *KubeClient) PatchDeployment(namespace, name string, request models.K8sDeploymentPatchRequest) (*appsv1.Deployment, error) {
	patch := map[string]any{}
	if len(request.Annotations) > 0 {
		patch["metadata"] = map[string]any{"annotations": request.Annotations}
	}
	if len(request.PodAnnotations) > 0 {
		patch["spec"] = map[string]any{
			"template": map[string]any{
				"metadata": map[string]any{"annotations": request.PodAnnotations},
			},
		}
	}

	encoded, err := json.Marshal(patch)
	if err != nil {
		return nil, fmt.Errorf("unable to encode the deployment patch. Error: %w", err)
	}

	patched, err := kcl.cli.AppsV1().Deployments(namespace).Patch(context.TODO(), name, types.StrategicMergePatchType, encoded, metav1.PatchOptions{})
	if err != nil {
		return nil, err
	}

	return prepareDeploymentForRead(patched), nil
}

// DeleteDeployment deletes the named deployment in the given namespace. The replica sets
// and pods it owns are garbage collected by the cluster.
func (kcl *KubeClient) DeleteDeployment(namespace, name string) error {
	return kcl.cli.AppsV1().Deployments(namespace).Delete(context.TODO(), name, metav1.DeleteOptions{})
}

// prepareDeploymentForRead trims a deployment returned by a write and stamps its kind,
// so write responses match what the read endpoints return.
func prepareDeploymentForRead(deployment *appsv1.Deployment) *appsv1.Deployment {
	trimDeploymentForRead(deployment)
	deployment.TypeMeta = metav1.TypeMeta{Kind: "Deployment", APIVersion: "apps/v1"}

	return deployment
}

// buildPodTemplate converts a pod template payload into its Kubernetes form. A nil
// payload yields an empty template, which the Kubernetes API rejects on create.
func buildPodTemplate(pod *models.K8sPodTemplate) corev1.PodTemplateSpec {
	template := corev1.PodTemplateSpec{}
	if pod == nil {
		return template
	}

	applyPodTemplate(&template, pod)

	return template
}

// applyPodTemplate replaces the modelled parts of a pod template, leaving the rest of
// the live template as it was.
func applyPodTemplate(template *corev1.PodTemplateSpec, pod *models.K8sPodTemplate) {
	if pod.Labels != nil {
		template.Labels = pod.Labels
	}
	if pod.Annotations != nil {
		template.Annotations = pod.Annotations
	}
	if pod.Containers != nil {
		template.Spec.Containers = buildContainers(pod.Containers)
	}
	if pod.Volumes != nil {
		template.Spec.Volumes = buildPodVolumes(pod.Volumes)
	}
}

func buildContainers(containers []models.K8sContainer) []corev1.Container {
	results := make([]corev1.Container, 0, len(containers))
	for _, container := range containers {
		results = append(results, corev1.Container{
			Name:            container.Name,
			Image:           container.Image,
			ImagePullPolicy: corev1.PullPolicy(container.ImagePullPolicy),
			Command:         container.Command,
			Args:            container.Args,
			WorkingDir:      container.WorkingDir,
			Ports:           buildContainerPorts(container.Ports),
			Env:             buildEnvVars(container.Env),
			EnvFrom:         buildEnvFromSecrets(container.EnvFromSecrets),
			Resources:       buildResourceRequirements(container.Resources),
			VolumeMounts:    buildVolumeMounts(container.VolumeMounts),
		})
	}

	return results
}

func buildContainerPorts(ports []models.K8sContainerPort) []corev1.ContainerPort {
	if len(ports) == 0 {
		return nil
	}

	results := make([]corev1.ContainerPort, 0, len(ports))
	for _, port := range ports {
		results = append(results, corev1.ContainerPort{
			Name:          port.Name,
			ContainerPort: port.ContainerPort,
			Protocol:      corev1.Protocol(port.Protocol),
		})
	}

	return results
}

func buildEnvVars(env []models.K8sEnvVar) []corev1.EnvVar {
	if len(env) == 0 {
		return nil
	}

	results := make([]corev1.EnvVar, 0, len(env))
	for _, variable := range env {
		result := corev1.EnvVar{Name: variable.Name}
		if variable.SecretRef != nil {
			result.ValueFrom = &corev1.EnvVarSource{
				SecretKeyRef: &corev1.SecretKeySelector{
					LocalObjectReference: corev1.LocalObjectReference{Name: variable.SecretRef.Name},
					Key:                  variable.SecretRef.Key,
				},
			}
		} else {
			result.Value = variable.Value
		}

		results = append(results, result)
	}

	return results
}

func buildEnvFromSecrets(secretNames []string) []corev1.EnvFromSource {
	if len(secretNames) == 0 {
		return nil
	}

	results := make([]corev1.EnvFromSource, 0, len(secretNames))
	for _, name := range secretNames {
		results = append(results, corev1.EnvFromSource{
			SecretRef: &corev1.SecretEnvSource{
				LocalObjectReference: corev1.LocalObjectReference{Name: name},
			},
		})
	}

	return results
}

// buildResourceRequirements converts the quantity strings of a payload into Kubernetes
// quantities. A value that does not parse is dropped rather than guessed at; the
// Kubernetes API rejects the malformed ones that reach it with a precise message.
func buildResourceRequirements(resources *models.K8sResourceRequirements) corev1.ResourceRequirements {
	if resources == nil {
		return corev1.ResourceRequirements{}
	}

	return corev1.ResourceRequirements{
		Requests: buildResourceList(resources.Requests),
		Limits:   buildResourceList(resources.Limits),
	}
}

func buildResourceList(quantities map[string]string) corev1.ResourceList {
	if len(quantities) == 0 {
		return nil
	}

	results := corev1.ResourceList{}
	for name, value := range quantities {
		quantity, err := resource.ParseQuantity(value)
		if err != nil {
			log.Warn().Err(err).Str("context", "buildResourceList").Str("resource", name).Str("value", value).Msg("Ignoring an unparsable resource quantity")
			continue
		}

		results[corev1.ResourceName(name)] = quantity
	}

	if len(results) == 0 {
		return nil
	}

	return results
}

func buildVolumeMounts(mounts []models.K8sVolumeMount) []corev1.VolumeMount {
	if len(mounts) == 0 {
		return nil
	}

	results := make([]corev1.VolumeMount, 0, len(mounts))
	for _, mount := range mounts {
		results = append(results, corev1.VolumeMount{
			Name:      mount.Name,
			MountPath: mount.MountPath,
			SubPath:   mount.SubPath,
			ReadOnly:  mount.ReadOnly,
		})
	}

	return results
}

func buildPodVolumes(volumes []models.K8sPodVolume) []corev1.Volume {
	if len(volumes) == 0 {
		return nil
	}

	results := make([]corev1.Volume, 0, len(volumes))
	for _, volume := range volumes {
		results = append(results, corev1.Volume{
			Name: volume.Name,
			VolumeSource: corev1.VolumeSource{
				PersistentVolumeClaim: &corev1.PersistentVolumeClaimVolumeSource{
					ClaimName: volume.ClaimName,
				},
			},
		})
	}

	return results
}
