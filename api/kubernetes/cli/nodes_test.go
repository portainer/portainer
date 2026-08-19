package cli

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func TestGetClusterNodes_ReturnsAllNodes(t *testing.T) {
	t.Parallel()

	nodeList := &corev1.NodeList{
		Items: []corev1.Node{
			{ObjectMeta: metav1.ObjectMeta{Name: "node-0"}},
			{ObjectMeta: metav1.ObjectMeta{Name: "node-1"}},
		},
	}

	kcl := &KubeClient{cli: kfake.NewSimpleClientset(nodeList)}

	got, err := kcl.GetClusterNodes()
	require.NoError(t, err)
	assert.Len(t, got, 2)
	assert.Equal(t, "node-0", got[0].Name)
	assert.Equal(t, "node-1", got[1].Name)
}

func TestGetClusterNodes_EmptyCluster(t *testing.T) {
	t.Parallel()

	kcl := &KubeClient{cli: kfake.NewSimpleClientset()}

	got, err := kcl.GetClusterNodes()
	require.NoError(t, err)
	assert.Empty(t, got)
}

func TestGetClusterNodes_StripsManagedFields(t *testing.T) {
	t.Parallel()

	nodeList := &corev1.NodeList{
		Items: []corev1.Node{
			{
				ObjectMeta: metav1.ObjectMeta{
					Name: "node-0",
					ManagedFields: []metav1.ManagedFieldsEntry{
						{Manager: "kubectl"},
					},
				},
			},
		},
	}

	kcl := &KubeClient{cli: kfake.NewSimpleClientset(nodeList)}

	got, err := kcl.GetClusterNodes()
	require.NoError(t, err)
	require.Len(t, got, 1)
	assert.Nil(t, got[0].ManagedFields)
}
