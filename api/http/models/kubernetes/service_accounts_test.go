package kubernetes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestK8sServiceAccountDeleteRequests_Validate(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name    string
		payload K8sServiceAccountDeleteRequests
		wantErr bool
		errMsg  string
	}{
		{
			name:    "empty payload returns error",
			payload: K8sServiceAccountDeleteRequests{},
			wantErr: true,
			errMsg:  "missing deletion request list in payload",
		},
		{
			name: "valid single namespace with service accounts",
			payload: K8sServiceAccountDeleteRequests{
				"default": {"sa-1", "sa-2"},
			},
			wantErr: false,
		},
		{
			name: "valid multiple namespaces",
			payload: K8sServiceAccountDeleteRequests{
				"default":     {"sa-1"},
				"kube-system": {"sa-2"},
				"custom-ns":   {"sa-3"},
			},
			wantErr: false,
		},
		{
			name: "empty namespace key returns error",
			payload: K8sServiceAccountDeleteRequests{
				"": {"sa-1"},
			},
			wantErr: true,
			errMsg:  "deletion given with empty namespace",
		},
		{
			name: "valid with empty service account list",
			payload: K8sServiceAccountDeleteRequests{
				"default": {},
			},
			wantErr: false,
		},
		{
			name: "multiple namespaces with one empty returns error",
			payload: K8sServiceAccountDeleteRequests{
				"default": {"sa-1"},
				"":        {"sa-2"},
			},
			wantErr: true,
			errMsg:  "deletion given with empty namespace",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/", nil)
			err := tt.payload.Validate(req)

			if tt.wantErr {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.errMsg)
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestK8sServiceAccount_Structure(t *testing.T) {
	t.Parallel()
	sa := K8sServiceAccount{
		Name:      "test-sa",
		Namespace: "default",
		IsSystem:  false,
	}

	assert.Equal(t, "test-sa", sa.Name)
	assert.Equal(t, "default", sa.Namespace)
	assert.False(t, sa.IsSystem)
	assert.Nil(t, sa.AutomountServiceAccountToken)
	assert.Empty(t, sa.Labels)
	assert.Empty(t, sa.Annotations)
}

func TestK8sServiceAccount_WithAllFields(t *testing.T) {
	t.Parallel()
	automountToken := true
	sa := K8sServiceAccount{
		Name:      "full-sa",
		Namespace: "production",
		IsSystem:  true,
		Labels: map[string]string{
			"app": "web",
			"env": "prod",
		},
		Annotations: map[string]string{
			"description": "service account for web",
		},
		AutomountServiceAccountToken: &automountToken,
	}

	assert.Equal(t, "full-sa", sa.Name)
	assert.Equal(t, "production", sa.Namespace)
	assert.True(t, sa.IsSystem)
	assert.NotNil(t, sa.AutomountServiceAccountToken)
	assert.True(t, *sa.AutomountServiceAccountToken)
	assert.Len(t, sa.Labels, 2)
	assert.Equal(t, "web", sa.Labels["app"])
	assert.Len(t, sa.Annotations, 1)
	assert.Equal(t, "service account for web", sa.Annotations["description"])
}
