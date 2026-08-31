package cli

import (
	"testing"

	"github.com/stretchr/testify/require"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	kfake "k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

func TestGetResourceQuotas(t *testing.T) {
	t.Parallel()
	kcl := &KubeClient{}

	resourceQuotas, err := kcl.GetResourceQuotas("default")
	require.NoError(t, err)
	require.Empty(t, resourceQuotas)
}

// TestFetchResourceQuotasForNonAdminNilResourceQuotas exercises the case where the
// underlying List call is tolerated as NotFound, leaving fetchResourceQuotas'
// resourceQuotas pointer nil, so fetchResourceQuotasForNonAdmin must return an
// empty result instead of dereferencing a nil pointer.
func TestFetchResourceQuotasForNonAdminNilResourceQuotas(t *testing.T) {
	t.Parallel()

	clientset := kfake.NewSimpleClientset()
	clientset.PrependReactor("list", "resourcequotas", func(action ktesting.Action) (bool, runtime.Object, error) {
		return true, nil, k8serrors.NewNotFound(schema.GroupResource{Resource: "resourcequotas"}, "")
	})

	kcl := &KubeClient{
		cli:         clientset,
		instanceID:  "instance",
		isKubeAdmin: false,
	}
	kcl.SetClientNonAdminNamespaces([]string{"ns-1"})

	resourceQuotas, err := kcl.GetResourceQuotas("")
	require.NoError(t, err)
	require.NotNil(t, resourceQuotas)
	require.Empty(t, *resourceQuotas)
}
