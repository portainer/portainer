package cli

import (
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func TestGetServices(t *testing.T) {
	t.Parallel()
	kcl := &KubeClient{}

	services, err := kcl.GetServices("default")
	require.NoError(t, err)
	require.Empty(t, services)
}

// suffix keeps names unique across namespaces so assertions stay unambiguous.
func webWorkload(namespace, suffix string) []runtime.Object {
	deploymentName := "deploy-" + suffix
	replicaSetName := "rs-" + suffix

	return []runtime.Object{
		&appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{Name: deploymentName, Namespace: namespace},
		},
		&appsv1.ReplicaSet{
			ObjectMeta: metav1.ObjectMeta{
				Name:            replicaSetName,
				Namespace:       namespace,
				OwnerReferences: []metav1.OwnerReference{{Kind: "Deployment", Name: deploymentName}},
			},
		},
		&corev1.Pod{
			ObjectMeta: metav1.ObjectMeta{
				Name:            "pod-" + suffix,
				Namespace:       namespace,
				Labels:          map[string]string{"app": "web"},
				OwnerReferences: []metav1.OwnerReference{{Kind: "ReplicaSet", Name: replicaSetName}},
			},
		},
	}
}

func webService(namespace string) models.K8sServiceInfo {
	return models.K8sServiceInfo{
		Name:      "web",
		Namespace: namespace,
		Selector:  map[string]string{"app": "web"},
	}
}

// GetApplicationFromServiceSelector matches on labels alone, so a cluster-wide
// resource fetch lets a team-b pod answer for a team-a service.
func TestCombineServicesWithApplications_ScopesLookupByNamespace(t *testing.T) {
	t.Parallel()

	kcl := &KubeClient{
		cli:         kfake.NewSimpleClientset(webWorkload("team-b", "b")...),
		isKubeAdmin: true,
	}

	result, err := kcl.CombineServicesWithApplications("team-a", []models.K8sServiceInfo{webService("team-a")})
	require.NoError(t, err)

	require.Len(t, result, 1)
	assert.Empty(t, result[0].Applications, "team-b workloads must not attach to a team-a service")
}

func TestCombineServicesWithApplications_ResolvesApplicationInOwnNamespace(t *testing.T) {
	t.Parallel()

	objects := append(webWorkload("team-a", "a"), webWorkload("team-b", "b")...)
	kcl := &KubeClient{
		cli:         kfake.NewSimpleClientset(objects...),
		isKubeAdmin: true,
	}

	result, err := kcl.CombineServicesWithApplications("team-a", []models.K8sServiceInfo{webService("team-a")})
	require.NoError(t, err)

	require.Len(t, result, 1)
	require.Len(t, result[0].Applications, 1)
	assert.Equal(t, "deploy-a", result[0].Applications[0].Name)
	assert.Equal(t, "Deployment", result[0].Applications[0].Kind)
}

// getAllKubernetesServices passes an empty namespace for the cluster-wide list.
func TestCombineServicesWithApplications_EmptyNamespaceStaysClusterWide(t *testing.T) {
	t.Parallel()

	kcl := &KubeClient{
		cli:         kfake.NewSimpleClientset(webWorkload("team-b", "b")...),
		isKubeAdmin: true,
	}

	result, err := kcl.CombineServicesWithApplications("", []models.K8sServiceInfo{webService("team-a")})
	require.NoError(t, err)

	require.Len(t, result, 1)
	require.Len(t, result[0].Applications, 1)
	assert.Equal(t, "deploy-b", result[0].Applications[0].Name)
}
