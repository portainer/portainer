package release

import (
	"reflect"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

// clearedByRedaction and keptByRedaction together must name every field of Release.
// A new field is a deliberate choice between the two, and TestRedactSensitive_CoversEveryField
// fails until that choice is made.
var (
	clearedByRedaction = []string{"Manifest", "Hooks", "Config", "Values"}
	keptByRedaction    = []string{"Name", "Info", "Chart", "AppVersion", "Version", "Namespace", "Labels", "ChartReference", "StackID"}
)

func populatedRelease() *Release {
	return &Release{
		Name:       "demo",
		Namespace:  "portainer",
		Version:    3,
		AppVersion: "1.2.3",
		Manifest:   "apiVersion: v1\nkind: Secret\ndata:\n  password: c3VwZXJzZWNyZXQ=\n",
		Config:     map[string]any{"password": "supersecret"},
		Hooks:      []*Hook{{Name: "pre-install", Manifest: "kind: Secret"}},
		Values: Values{
			UserSuppliedValues: "password: supersecret",
			ComputedValues:     "password: supersecret",
		},
		Labels:         map[string]string{"owner": "helm"},
		ChartReference: ChartReference{RepoURL: "https://charts.example.com"},
		StackID:        7,
		Chart:          Chart{Values: map[string]any{"password": "default"}},
		Info: &Info{
			Status:        "deployed",
			Description:   "Install complete",
			FirstDeployed: time.Now(),
			LastDeployed:  time.Now(),
			Notes:         "Your password is supersecret",
			Resources:     []*unstructured.Unstructured{{Object: map[string]any{"kind": "Deployment"}}},
		},
	}
}

func TestRedactSensitive(t *testing.T) {
	t.Parallel()

	r := populatedRelease()
	r.RedactSensitive()

	t.Run("clears everything that can carry secret data", func(t *testing.T) {
		assert.Empty(t, r.Manifest, "the rendered manifest can contain Secret objects")
		assert.Empty(t, r.Hooks, "hook manifests can contain Secret objects")
		assert.Empty(t, r.Config, "extra values can contain credentials")
		assert.Equal(t, Values{}, r.Values, "user-supplied and computed values can contain credentials")
		assert.Empty(t, r.Info.Notes, "notes are templated and can interpolate values")
	})

	t.Run("keeps the resource list, which carries no secret data", func(t *testing.T) {
		assert.Len(t, r.Info.Resources, 1, "resources are reduced to metadata, kind and status before they reach redaction")
	})

	t.Run("keeps the metadata needed to identify the release", func(t *testing.T) {
		assert.Equal(t, "demo", r.Name)
		assert.Equal(t, "portainer", r.Namespace)
		assert.Equal(t, 3, r.Version)
		assert.Equal(t, "1.2.3", r.AppVersion)
		assert.Equal(t, 7, r.StackID)
		assert.Equal(t, "https://charts.example.com", r.ChartReference.RepoURL)
		assert.EqualValues(t, "deployed", r.Info.Status)
		assert.Equal(t, "Install complete", r.Info.Description)
	})

}

func TestRedactSensitive_NilInfoAndNilReceiver(t *testing.T) {
	t.Parallel()

	assert.NotPanics(t, func() { (*Release)(nil).RedactSensitive() })

	r := &Release{Name: "demo"}
	assert.NotPanics(t, func() { r.RedactSensitive() })
}

// TestRedactSensitive_CoversEveryField fails when a field is added to Release without
// deciding whether redaction should clear it. Without this, a new field carrying secret
// data would ship through the redacted response unnoticed.
func TestRedactSensitive_CoversEveryField(t *testing.T) {
	t.Parallel()

	classified := make(map[string]bool, len(clearedByRedaction)+len(keptByRedaction))
	for _, name := range append(append([]string{}, clearedByRedaction...), keptByRedaction...) {
		classified[name] = true
	}

	releaseType := reflect.TypeFor[Release]()
	for field := range releaseType.Fields() {
		assert.True(t, classified[field.Name], "Release.%s is neither cleared nor kept by RedactSensitive; add it to clearedByRedaction or keptByRedaction", field.Name)
	}

	assert.Len(t, classified, releaseType.NumField(), "clearedByRedaction/keptByRedaction name a field that no longer exists on Release")
}

// TestRedactSensitive_ClearsEveryFieldItClaimsTo guards the other direction: a field listed
// as cleared must actually come back zero.
func TestRedactSensitive_ClearsEveryFieldItClaimsTo(t *testing.T) {
	t.Parallel()

	r := populatedRelease()
	before := reflect.ValueOf(*r)
	for _, name := range clearedByRedaction {
		require.False(t, before.FieldByName(name).IsZero(), "the fixture must populate %s for this test to mean anything", name)
	}

	r.RedactSensitive()

	after := reflect.ValueOf(*r)
	for _, name := range clearedByRedaction {
		assert.True(t, after.FieldByName(name).IsZero(), "RedactSensitive left Release.%s populated", name)
	}
}
