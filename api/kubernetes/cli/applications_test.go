package cli

import (
	"context"
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/stretchr/testify/assert"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes/fake"
)

// Helper functions to create test resources
func createTestDeployment(name, namespace string, replicas int32) *appsv1.Deployment {
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			UID:       types.UID("deploy-" + name),
			Labels: map[string]string{
				"app": name,
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": name,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": name,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  name,
							Image: "nginx:latest",
							Resources: corev1.ResourceRequirements{
								Limits:   corev1.ResourceList{},
								Requests: corev1.ResourceList{},
							},
						},
					},
				},
			},
		},
		Status: appsv1.DeploymentStatus{
			Replicas:      replicas,
			ReadyReplicas: replicas,
		},
	}
}

func createTestReplicaSet(name, namespace, deploymentName string) *appsv1.ReplicaSet {
	return &appsv1.ReplicaSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			UID:       types.UID("rs-" + name),
			OwnerReferences: []metav1.OwnerReference{
				{
					Kind: "Deployment",
					Name: deploymentName,
					UID:  types.UID("deploy-" + deploymentName),
				},
			},
		},
		Spec: appsv1.ReplicaSetSpec{
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": deploymentName,
				},
			},
		},
	}
}

func createTestStatefulSet(name, namespace string, replicas int32) *appsv1.StatefulSet {
	return &appsv1.StatefulSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			UID:       types.UID("sts-" + name),
			Labels: map[string]string{
				"app": name,
			},
		},
		Spec: appsv1.StatefulSetSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": name,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": name,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  name,
							Image: "redis:latest",
							Resources: corev1.ResourceRequirements{
								Limits:   corev1.ResourceList{},
								Requests: corev1.ResourceList{},
							},
						},
					},
				},
			},
		},
		Status: appsv1.StatefulSetStatus{
			Replicas:      replicas,
			ReadyReplicas: replicas,
		},
	}
}

func createTestDaemonSet(name, namespace string) *appsv1.DaemonSet {
	return &appsv1.DaemonSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			UID:       types.UID("ds-" + name),
			Labels: map[string]string{
				"app": name,
			},
		},
		Spec: appsv1.DaemonSetSpec{
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": name,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": name,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  name,
							Image: "fluentd:latest",
							Resources: corev1.ResourceRequirements{
								Limits:   corev1.ResourceList{},
								Requests: corev1.ResourceList{},
							},
						},
					},
				},
			},
		},
		Status: appsv1.DaemonSetStatus{
			DesiredNumberScheduled: 2,
			NumberReady:            2,
		},
	}
}

func createTestPod(name, namespace, ownerKind, ownerName string, isRunning bool) *corev1.Pod {
	phase := corev1.PodPending
	if isRunning {
		phase = corev1.PodRunning
	}

	var ownerReferences []metav1.OwnerReference
	if ownerKind != "" && ownerName != "" {
		ownerReferences = []metav1.OwnerReference{
			{
				Kind: ownerKind,
				Name: ownerName,
				UID:  types.UID(ownerKind + "-" + ownerName),
			},
		}
	}

	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:            name,
			Namespace:       namespace,
			UID:             types.UID("pod-" + name),
			OwnerReferences: ownerReferences,
			Labels: map[string]string{
				"app": ownerName,
			},
		},
		Spec: corev1.PodSpec{
			Containers: []corev1.Container{
				{
					Name:  "container-" + name,
					Image: "busybox:latest",
					Resources: corev1.ResourceRequirements{
						Limits:   corev1.ResourceList{},
						Requests: corev1.ResourceList{},
					},
				},
			},
		},
		Status: corev1.PodStatus{
			Phase: phase,
		},
	}
}

func createTestService(name, namespace string, selector map[string]string) *corev1.Service {
	return &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: namespace,
			UID:       types.UID("svc-" + name),
		},
		Spec: corev1.ServiceSpec{
			Selector: selector,
			Type:     corev1.ServiceTypeClusterIP,
		},
	}
}

func TestGetApplications(t *testing.T) {
	t.Run("Admin user - Mix of deployments, statefulsets and daemonsets with and without pods", func(t *testing.T) {
		// Create a fake K8s client
		fakeClient := fake.NewSimpleClientset()

		// Setup the test namespace
		namespace := "test-namespace"
		defaultNamespace := "default"

		// Create resources in the test namespace
		// 1. Deployment with pods
		deployWithPods := createTestDeployment("deploy-with-pods", namespace, 2)
		_, err := fakeClient.AppsV1().Deployments(namespace).Create(context.TODO(), deployWithPods, metav1.CreateOptions{})
		assert.NoError(t, err)

		replicaSet := createTestReplicaSet("rs-deploy-with-pods", namespace, "deploy-with-pods")
		_, err = fakeClient.AppsV1().ReplicaSets(namespace).Create(context.TODO(), replicaSet, metav1.CreateOptions{})
		assert.NoError(t, err)

		pod1 := createTestPod("pod1-deploy", namespace, "ReplicaSet", "rs-deploy-with-pods", true)
		_, err = fakeClient.CoreV1().Pods(namespace).Create(context.TODO(), pod1, metav1.CreateOptions{})
		assert.NoError(t, err)

		pod2 := createTestPod("pod2-deploy", namespace, "ReplicaSet", "rs-deploy-with-pods", true)
		_, err = fakeClient.CoreV1().Pods(namespace).Create(context.TODO(), pod2, metav1.CreateOptions{})
		assert.NoError(t, err)

		// 2. Deployment without pods (scaled to 0)
		deployNoPods := createTestDeployment("deploy-no-pods", namespace, 0)
		_, err = fakeClient.AppsV1().Deployments(namespace).Create(context.TODO(), deployNoPods, metav1.CreateOptions{})
		assert.NoError(t, err)

		// 3. StatefulSet with pods
		stsWithPods := createTestStatefulSet("sts-with-pods", namespace, 1)
		_, err = fakeClient.AppsV1().StatefulSets(namespace).Create(context.TODO(), stsWithPods, metav1.CreateOptions{})
		assert.NoError(t, err)

		pod3 := createTestPod("pod1-sts", namespace, "StatefulSet", "sts-with-pods", true)
		_, err = fakeClient.CoreV1().Pods(namespace).Create(context.TODO(), pod3, metav1.CreateOptions{})
		assert.NoError(t, err)

		// 4. StatefulSet without pods
		stsNoPods := createTestStatefulSet("sts-no-pods", namespace, 0)
		_, err = fakeClient.AppsV1().StatefulSets(namespace).Create(context.TODO(), stsNoPods, metav1.CreateOptions{})
		assert.NoError(t, err)

		// 5. DaemonSet with pods
		dsWithPods := createTestDaemonSet("ds-with-pods", namespace)
		_, err = fakeClient.AppsV1().DaemonSets(namespace).Create(context.TODO(), dsWithPods, metav1.CreateOptions{})
		assert.NoError(t, err)

		pod4 := createTestPod("pod1-ds", namespace, "DaemonSet", "ds-with-pods", true)
		_, err = fakeClient.CoreV1().Pods(namespace).Create(context.TODO(), pod4, metav1.CreateOptions{})
		assert.NoError(t, err)

		pod5 := createTestPod("pod2-ds", namespace, "DaemonSet", "ds-with-pods", true)
		_, err = fakeClient.CoreV1().Pods(namespace).Create(context.TODO(), pod5, metav1.CreateOptions{})
		assert.NoError(t, err)

		// 6. Naked Pod (no owner reference)
		nakedPod := createTestPod("naked-pod", namespace, "", "", true)
		_, err = fakeClient.CoreV1().Pods(namespace).Create(context.TODO(), nakedPod, metav1.CreateOptions{})
		assert.NoError(t, err)

		// 7. Resources in another namespace
		deployOtherNs := createTestDeployment("deploy-other-ns", defaultNamespace, 1)
		_, err = fakeClient.AppsV1().Deployments(defaultNamespace).Create(context.TODO(), deployOtherNs, metav1.CreateOptions{})
		assert.NoError(t, err)

		podOtherNs := createTestPod("pod-other-ns", defaultNamespace, "Deployment", "deploy-other-ns", true)
		_, err = fakeClient.CoreV1().Pods(defaultNamespace).Create(context.TODO(), podOtherNs, metav1.CreateOptions{})
		assert.NoError(t, err)

		// 8. Add a service (dependency)
		service := createTestService("svc-deploy", namespace, map[string]string{"app": "deploy-with-pods"})
		_, err = fakeClient.CoreV1().Services(namespace).Create(context.TODO(), service, metav1.CreateOptions{})
		assert.NoError(t, err)

		// Create the KubeClient with admin privileges
		kubeClient := &KubeClient{
			cli:         fakeClient,
			instanceID:  "test-instance",
			IsKubeAdmin: true,
		}

		// Test cases

		// 1. All resources, no filtering
		t.Run("All resources with dependencies", func(t *testing.T) {
			apps, err := kubeClient.GetApplications("", "")
			assert.NoError(t, err)

			// We expect 7 resources: 2 deployments + 2 statefulsets + 1 daemonset + 1 naked pod + 1 deployment in other namespace
			// Note: Each controller with pods should count once, not per pod
			assert.Equal(t, 7, len(apps))

			// Verify one of the deployments has services attached
			appsWithServices := []models.K8sApplication{}
			for _, app := range apps {
				if len(app.Services) > 0 {
					appsWithServices = append(appsWithServices, app)
				}
			}
			assert.Equal(t, 1, len(appsWithServices))
			assert.Equal(t, "deploy-with-pods", appsWithServices[0].Name)
		})

		// 2. Filter by namespace
		t.Run("Filter by namespace", func(t *testing.T) {
			apps, err := kubeClient.GetApplications(namespace, "")
			assert.NoError(t, err)

			// We expect 6 resources in the test namespace
			assert.Equal(t, 6, len(apps))

			// Verify resources from other namespaces are not included
			for _, app := range apps {
				assert.Equal(t, namespace, app.ResourcePool)
			}
		})
	})

	t.Run("Non-admin user - Resources filtered by accessible namespaces", func(t *testing.T) {
		// Create a fake K8s client
		fakeClient := fake.NewSimpleClientset()

		// Setup the test namespaces
		namespace1 := "allowed-ns"
		namespace2 := "restricted-ns"

		// Create resources in the allowed namespace
		sts1 := createTestStatefulSet("sts-allowed", namespace1, 1)
		_, err := fakeClient.AppsV1().StatefulSets(namespace1).Create(context.TODO(), sts1, metav1.CreateOptions{})
		assert.NoError(t, err)

		pod1 := createTestPod("pod-allowed", namespace1, "StatefulSet", "sts-allowed", true)
		_, err = fakeClient.CoreV1().Pods(namespace1).Create(context.TODO(), pod1, metav1.CreateOptions{})
		assert.NoError(t, err)

		// Add a StatefulSet without pods in the allowed namespace
		stsNoPods := createTestStatefulSet("sts-no-pods-allowed", namespace1, 0)
		_, err = fakeClient.AppsV1().StatefulSets(namespace1).Create(context.TODO(), stsNoPods, metav1.CreateOptions{})
		assert.NoError(t, err)

		// Create resources in the restricted namespace
		sts2 := createTestStatefulSet("sts-restricted", namespace2, 1)
		_, err = fakeClient.AppsV1().StatefulSets(namespace2).Create(context.TODO(), sts2, metav1.CreateOptions{})
		assert.NoError(t, err)

		pod2 := createTestPod("pod-restricted", namespace2, "StatefulSet", "sts-restricted", true)
		_, err = fakeClient.CoreV1().Pods(namespace2).Create(context.TODO(), pod2, metav1.CreateOptions{})
		assert.NoError(t, err)

		// Create the KubeClient with non-admin privileges (only allowed namespace1)
		kubeClient := &KubeClient{
			cli:                fakeClient,
			instanceID:         "test-instance",
			IsKubeAdmin:        false,
			NonAdminNamespaces: []string{namespace1},
		}

		// Test that only resources from allowed namespace are returned
		apps, err := kubeClient.GetApplications("", "")
		assert.NoError(t, err)

		// We expect 2 resources from the allowed namespace (1 sts with pod + 1 sts without pod)
		assert.Equal(t, 2, len(apps))

		// Verify resources are from the allowed namespace
		for _, app := range apps {
			assert.Equal(t, namespace1, app.ResourcePool)
			assert.Equal(t, "StatefulSet", app.Kind)
		}

		// Verify names of returned resources
		stsNames := make(map[string]bool)
		for _, app := range apps {
			stsNames[app.Name] = true
		}

		assert.True(t, stsNames["sts-allowed"], "Expected StatefulSet 'sts-allowed' was not found")
		assert.True(t, stsNames["sts-no-pods-allowed"], "Expected StatefulSet 'sts-no-pods-allowed' was not found")
	})

	t.Run("Filter by node name", func(t *testing.T) {
		// Create a fake K8s client
		fakeClient := fake.NewSimpleClientset()

		// Setup test namespace
		namespace := "node-filter-ns"
		nodeName := "worker-node-1"

		// Create a deployment with pods on specific node
		deploy := createTestDeployment("node-deploy", namespace, 2)
		_, err := fakeClient.AppsV1().Deployments(namespace).Create(context.TODO(), deploy, metav1.CreateOptions{})
		assert.NoError(t, err)

		// Create ReplicaSet for the deployment
		rs := createTestReplicaSet("rs-node-deploy", namespace, "node-deploy")
		_, err = fakeClient.AppsV1().ReplicaSets(namespace).Create(context.TODO(), rs, metav1.CreateOptions{})
		assert.NoError(t, err)

		// Create 2 pods, one on the specified node, one on a different node
		pod1 := createTestPod("pod-on-node", namespace, "ReplicaSet", "rs-node-deploy", true)
		pod1.Spec.NodeName = nodeName
		_, err = fakeClient.CoreV1().Pods(namespace).Create(context.TODO(), pod1, metav1.CreateOptions{})
		assert.NoError(t, err)

		pod2 := createTestPod("pod-other-node", namespace, "ReplicaSet", "rs-node-deploy", true)
		pod2.Spec.NodeName = "worker-node-2"
		_, err = fakeClient.CoreV1().Pods(namespace).Create(context.TODO(), pod2, metav1.CreateOptions{})
		assert.NoError(t, err)

		// Create the KubeClient
		kubeClient := &KubeClient{
			cli:         fakeClient,
			instanceID:  "test-instance",
			IsKubeAdmin: true,
		}

		// Test filtering by node name
		apps, err := kubeClient.GetApplications(namespace, nodeName)
		assert.NoError(t, err)

		// We expect to find only the pod on the specified node
		assert.Equal(t, 1, len(apps))
		if len(apps) > 0 {
			assert.Equal(t, "node-deploy", apps[0].Name)
		}
	})
}
