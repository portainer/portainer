package cli

import (
	"context"
	"strconv"
	"sync"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
	core "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func Test_ToggleSystemState(t *testing.T) {
	t.Run("should skip is default (exit without error)", func(t *testing.T) {
		nsName := "default"
		kcl := &KubeClient{
			cli:        kfake.NewSimpleClientset(&core.Namespace{ObjectMeta: metav1.ObjectMeta{Name: nsName}}),
			instanceID: "instance",
			lock:       &sync.Mutex{},
		}

		err := kcl.ToggleSystemState(nsName, true)
		assert.NoError(t, err)

		ns, err := kcl.cli.CoreV1().Namespaces().Get(context.Background(), nsName, metav1.GetOptions{})
		assert.NoError(t, err)

		_, exists := ns.Labels[systemNamespaceLabel]
		assert.False(t, exists, "system label should not exists")
	})

	t.Run("should fail if namespace doesn't exist", func(t *testing.T) {
		nsName := "not-exist"
		kcl := &KubeClient{
			cli:        kfake.NewSimpleClientset(),
			instanceID: "instance",
			lock:       &sync.Mutex{},
		}

		err := kcl.ToggleSystemState(nsName, true)
		assert.Error(t, err)

	})

	t.Run("if called with the same state, should skip (exit without error)", func(t *testing.T) {
		nsName := "namespace"
		tests := []struct {
			isSystem bool
		}{
			{isSystem: true},
			{isSystem: false},
		}

		for _, test := range tests {
			t.Run(strconv.FormatBool(test.isSystem), func(t *testing.T) {
				kcl := &KubeClient{
					cli: kfake.NewSimpleClientset(&core.Namespace{ObjectMeta: metav1.ObjectMeta{Name: nsName, Labels: map[string]string{
						systemNamespaceLabel: strconv.FormatBool(test.isSystem),
					}}}),
					instanceID: "instance",
					lock:       &sync.Mutex{},
				}

				err := kcl.ToggleSystemState(nsName, test.isSystem)
				assert.NoError(t, err)

				ns, err := kcl.cli.CoreV1().Namespaces().Get(context.Background(), nsName, metav1.GetOptions{})
				assert.NoError(t, err)

				assert.Equal(t, test.isSystem, isSystemNamespace(*ns))
			})
		}
	})

	t.Run("for regular namespace if isSystem is true and doesn't have a label, should set the label to true", func(t *testing.T) {
		nsName := "namespace"

		kcl := &KubeClient{
			cli:        kfake.NewSimpleClientset(&core.Namespace{ObjectMeta: metav1.ObjectMeta{Name: nsName}}),
			instanceID: "instance",
			lock:       &sync.Mutex{},
		}

		err := kcl.ToggleSystemState(nsName, true)
		assert.NoError(t, err)

		ns, err := kcl.cli.CoreV1().Namespaces().Get(context.Background(), nsName, metav1.GetOptions{})
		assert.NoError(t, err)

		labelValue, exists := ns.Labels[systemNamespaceLabel]
		assert.True(t, exists, "system label should exists")

		assert.Equal(t, "true", labelValue)
	})

	t.Run("for default system namespace if isSystem is false and doesn't have a label, should set the label to false", func(t *testing.T) {
		nsName := "portainer"

		kcl := &KubeClient{
			cli:        kfake.NewSimpleClientset(&core.Namespace{ObjectMeta: metav1.ObjectMeta{Name: nsName}}),
			instanceID: "instance",
			lock:       &sync.Mutex{},
		}

		err := kcl.ToggleSystemState(nsName, false)
		assert.NoError(t, err)

		ns, err := kcl.cli.CoreV1().Namespaces().Get(context.Background(), nsName, metav1.GetOptions{})
		assert.NoError(t, err)

		labelValue, exists := ns.Labels[systemNamespaceLabel]
		assert.True(t, exists, "system label should exists")

		assert.Equal(t, "false", labelValue)
	})

	t.Run("for system namespace (with label), if called with false, should set the label", func(t *testing.T) {
		nsName := "namespace"

		kcl := &KubeClient{
			cli: kfake.NewSimpleClientset(&core.Namespace{ObjectMeta: metav1.ObjectMeta{Name: nsName, Labels: map[string]string{
				systemNamespaceLabel: "true",
			}}}),
			instanceID: "instance",
			lock:       &sync.Mutex{},
		}

		err := kcl.ToggleSystemState(nsName, false)
		assert.NoError(t, err)

		ns, err := kcl.cli.CoreV1().Namespaces().Get(context.Background(), nsName, metav1.GetOptions{})
		assert.NoError(t, err)

		labelValue, exists := ns.Labels[systemNamespaceLabel]
		assert.True(t, exists, "system label should exists")
		assert.Equal(t, "false", labelValue)
	})

	t.Run("for non system namespace (with label), if called with true, should set the label, and remove accesses", func(t *testing.T) {
		nsName := "ns1"

		namespace := &core.Namespace{ObjectMeta: metav1.ObjectMeta{Name: nsName, Labels: map[string]string{
			systemNamespaceLabel: "false",
		}}}

		config := &core.ConfigMap{
			ObjectMeta: metav1.ObjectMeta{
				Name:      portainerConfigMapName,
				Namespace: portainerNamespace,
			},
			Data: map[string]string{
				"NamespaceAccessPolicies": `{"ns1":{"UserAccessPolicies":{"2":{"RoleId":0}}}, "ns2":{"UserAccessPolicies":{"2":{"RoleId":0}}}}`,
			},
		}

		kcl := &KubeClient{
			cli:        kfake.NewSimpleClientset(namespace, config),
			instanceID: "instance",
			lock:       &sync.Mutex{},
		}

		err := kcl.ToggleSystemState(nsName, true)
		assert.NoError(t, err)

		ns, err := kcl.cli.CoreV1().Namespaces().Get(context.Background(), nsName, metav1.GetOptions{})
		assert.NoError(t, err)

		labelValue, exists := ns.Labels[systemNamespaceLabel]
		assert.True(t, exists, "system label should exists")
		assert.Equal(t, "true", labelValue)

		expectedPolicies := map[string]portainer.K8sNamespaceAccessPolicy{
			"ns2": {UserAccessPolicies: portainer.UserAccessPolicies{2: {RoleID: 0}}},
		}
		actualPolicies, err := kcl.GetNamespaceAccessPolicies()
		assert.NoError(t, err, "failed to fetch policies")
		assert.Equal(t, expectedPolicies, actualPolicies)

	})
}
