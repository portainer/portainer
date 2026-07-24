package cli

import (
	"testing"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	netv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func TestGetIngresses(t *testing.T) {
	t.Parallel()
	kcl := &KubeClient{}

	ingresses, err := kcl.GetIngresses("default")
	require.NoError(t, err)
	require.Empty(t, ingresses)
}

func TestParseIngress_NamedServicePort(t *testing.T) {
	t.Parallel()

	pathType := netv1.PathTypePrefix
	ingress := netv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{Name: "repro-ingress", Namespace: "default"},
		Spec: netv1.IngressSpec{
			Rules: []netv1.IngressRule{
				{
					Host: "repro.example.com",
					IngressRuleValue: netv1.IngressRuleValue{
						HTTP: &netv1.HTTPIngressRuleValue{
							Paths: []netv1.HTTPIngressPath{
								{
									Path:     "/",
									PathType: &pathType,
									Backend: netv1.IngressBackend{
										Service: &netv1.IngressServiceBackend{
											Name: "repro-service",
											Port: netv1.ServiceBackendPort{Name: "http"},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	result := parseIngress(ingress)

	require.Len(t, result.Paths, 1)
	assert.Equal(t, 0, result.Paths[0].Port)
	assert.Equal(t, "http", result.Paths[0].PortName)
}

func TestResolvePortByName(t *testing.T) {
	t.Parallel()

	service := models.K8sServiceInfo{
		Ports: []models.K8sServicePort{{Name: "http", Port: 80}},
	}

	tests := []struct {
		name     string
		path     models.K8sIngressPath
		wantPort int
	}{
		{"resolves matching named port", models.K8sIngressPath{PortName: "http"}, 80},
		{"leaves non-zero port untouched", models.K8sIngressPath{Port: 8080, PortName: "http"}, 8080},
		{"skip when port name is empty", models.K8sIngressPath{}, 0},
		{"skip when no port matches the name", models.K8sIngressPath{PortName: "grpc"}, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			path := tt.path
			resolvePortByName(&path, service)

			assert.Equal(t, tt.wantPort, path.Port)
		})
	}
}

func TestCombineIngressWithService_ResolvesNamedPort(t *testing.T) {
	t.Parallel()

	kcl := &KubeClient{
		cli: kfake.NewSimpleClientset(&corev1.Service{
			ObjectMeta: metav1.ObjectMeta{Name: "repro-service", Namespace: "default"},
			Spec: corev1.ServiceSpec{
				Ports: []corev1.ServicePort{{Name: "http", Port: 80}},
			},
		}),
		isKubeAdmin: true,
	}

	ingress := models.K8sIngressInfo{
		Namespace: "default",
		Paths: []models.K8sIngressPath{
			{ServiceName: "repro-service", PortName: "http"},
		},
	}

	result, err := kcl.CombineIngressWithService(ingress)
	require.NoError(t, err)

	require.Len(t, result.Paths, 1)
	assert.True(t, result.Paths[0].HasService)
	assert.Equal(t, 80, result.Paths[0].Port)
}

func TestCombineIngressesWithServices_ScopesLookupByNamespace(t *testing.T) {
	t.Parallel()

	kcl := &KubeClient{
		cli: kfake.NewSimpleClientset(
			&corev1.Service{
				ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "team-a"},
				Spec:       corev1.ServiceSpec{Ports: []corev1.ServicePort{{Name: "http", Port: 8080}}},
			},
			&corev1.Service{
				ObjectMeta: metav1.ObjectMeta{Name: "web", Namespace: "team-b"},
				Spec:       corev1.ServiceSpec{Ports: []corev1.ServicePort{{Name: "http", Port: 9090}}},
			},
		),
		isKubeAdmin: true,
	}

	ingresses := []models.K8sIngressInfo{
		{
			Namespace: "team-a",
			Paths:     []models.K8sIngressPath{{ServiceName: "web", PortName: "http"}},
		},
	}

	result, err := kcl.CombineIngressesWithServices(ingresses)
	require.NoError(t, err)

	require.Len(t, result, 1)
	require.Len(t, result[0].Paths, 1)
	assert.True(t, result[0].Paths[0].HasService)
	assert.Equal(t, 8080, result[0].Paths[0].Port)
}
