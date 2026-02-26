package libkubectl

import (
	"context"
	"os"
	"strings"
	"testing"

	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/dynamic/fake"
	k8stesting "k8s.io/client-go/testing"
)

// TestApplyDynamic tests require a Kubernetes cluster.
//
// Running the tests:
//   - With cluster: go test -v ./pkg/libkubectl -run TestApplyDynamic
//   - Without cluster: Tests will skip automatically
//
// Cleanup: Tests automatically clean up resources using client.DeleteDynamic().
// Resources are deleted after each test completes, keeping the cluster clean.

// skipIfNoKubeconfig skips the test if no kubeconfig is available
func skipIfNoKubeconfig(tb testing.TB) string {
	tb.Helper()

	// Check for kubeconfig in environment variable
	kubeconfig := os.Getenv("KUBECONFIG")
	if kubeconfig == "" {
		// Try default location
		homeDir, err := os.UserHomeDir()
		if err != nil {
			tb.Skip("No KUBECONFIG environment variable set and cannot determine home directory")
		}
		kubeconfig = homeDir + "/.kube/config"
	}

	// Check if kubeconfig file exists
	if _, err := os.Stat(kubeconfig); os.IsNotExist(err) {
		tb.Skip("No Kubernetes cluster available (kubeconfig not found). Set KUBECONFIG environment variable to run these tests")
	}

	return kubeconfig
}

func TestApplyDynamic(t *testing.T) {
	tests := []struct {
		name      string
		manifests []string
		wantErr   bool
		errMsg    string
		desc      string
	}{
		{
			name: "apply simple deployment",
			desc: "Test basic deployment resource application",
			manifests: []string{
				`apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-deployment
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test
  template:
    metadata:
      labels:
        app: test
    spec:
      containers:
      - name: test
        image: nginx:latest`,
			},
			wantErr: false,
		},
		{
			name: "apply statefulset",
			desc: "Test StatefulSet resource application",
			manifests: []string{
				`apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: test-statefulset
  namespace: default
spec:
  serviceName: test-service
  replicas: 2
  selector:
    matchLabels:
      app: test-stateful
  template:
    metadata:
      labels:
        app: test-stateful
    spec:
      containers:
      - name: test
        image: nginx:latest`,
			},
			wantErr: false,
		},
		{
			name: "apply daemonset",
			desc: "Test DaemonSet resource application",
			manifests: []string{
				`apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: test-daemonset
  namespace: default
spec:
  selector:
    matchLabels:
      app: test-daemon
  template:
    metadata:
      labels:
        app: test-daemon
    spec:
      containers:
      - name: test
        image: nginx:latest`,
			},
			wantErr: false,
		},
		{
			name: "apply service",
			desc: "Test Service resource application",
			manifests: []string{
				`apiVersion: v1
kind: Service
metadata:
  name: test-service
  namespace: default
spec:
  selector:
    app: test
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080`,
			},
			wantErr: false,
		},
		{
			name: "apply ingress",
			desc: "Test Ingress resource application",
			manifests: []string{
				`apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: test-ingress
  namespace: default
spec:
  rules:
  - host: test.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: test-service
            port:
              number: 80`,
			},
			wantErr: false,
		},
		{
			name: "apply configmap and secret",
			desc: "Test ConfigMap and Secret resource application",
			manifests: []string{
				`apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
  namespace: default
data:
  key1: value1
  key2: value2
---
apiVersion: v1
kind: Secret
metadata:
  name: test-secret
  namespace: default
type: Opaque
stringData:
  username: admin
  password: secret123`,
			},
			wantErr: false,
		},
		{
			name: "apply persistent volume claim",
			desc: "Test PersistentVolumeClaim resource application",
			manifests: []string{
				`apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: test-pvc
  namespace: default
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi`,
			},
			wantErr: false,
		},
		{
			name: "apply serviceaccount with rbac",
			desc: "Test ServiceAccount, Role, and RoleBinding resources",
			manifests: []string{
				`apiVersion: v1
kind: ServiceAccount
metadata:
  name: test-sa
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: test-role
  namespace: default
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: test-rolebinding
  namespace: default
subjects:
- kind: ServiceAccount
  name: test-sa
  namespace: default
roleRef:
  kind: Role
  name: test-role
  apiGroup: rbac.authorization.k8s.io`,
			},
			wantErr: false,
		},
		{
			name: "apply cluster-scoped resources",
			desc: "Test cluster-scoped resources (ClusterRole, ClusterRoleBinding)",
			manifests: []string{
				`apiVersion: v1
kind: Namespace
metadata:
  name: test-namespace
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: test-cluster-role
rules:
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: test-cluster-rolebinding
subjects:
- kind: ServiceAccount
  name: default
  namespace: default
roleRef:
  kind: ClusterRole
  name: test-cluster-role
  apiGroup: rbac.authorization.k8s.io`,
			},
			wantErr: false,
		},
		{
			name: "apply job and cronjob",
			desc: "Test Job and CronJob resources",
			manifests: []string{
				`apiVersion: batch/v1
kind: Job
metadata:
  name: test-job
  namespace: default
spec:
  template:
    spec:
      containers:
      - name: test
        image: busybox
        command: ["echo", "Hello"]
      restartPolicy: Never
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: test-cronjob
  namespace: default
spec:
  schedule: "*/5 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: test
            image: busybox
            command: ["echo", "Scheduled"]
          restartPolicy: Never`,
			},
			wantErr: false,
		},
		{
			name: "apply network policy",
			desc: "Test NetworkPolicy resource application",
			manifests: []string{
				`apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: test-network-policy
  namespace: default
spec:
  podSelector:
    matchLabels:
      app: test
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080`,
			},
			wantErr: false,
		},
		{
			name: "apply horizontal pod autoscaler",
			desc: "Test HorizontalPodAutoscaler resource application",
			manifests: []string{
				`apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: test-hpa
  namespace: default
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: test-deployment
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80`,
			},
			wantErr: false,
		},
		{
			name: "apply full application stack",
			desc: "Test complete application with multiple resources",
			manifests: []string{
				`apiVersion: v1
kind: Namespace
metadata:
  name: test-app
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: test-app
data:
  DATABASE_URL: postgresql://db:5432
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: test-app
type: Opaque
stringData:
  db-password: supersecret
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
  namespace: test-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: nginx:latest
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secret
---
apiVersion: v1
kind: Service
metadata:
  name: app-service
  namespace: test-app
spec:
  selector:
    app: myapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080`,
			},
			wantErr: false,
		},
		{
			name: "apply multiple manifests separately",
			desc: "Test applying multiple manifests in separate strings",
			manifests: []string{
				`apiVersion: v1
kind: Namespace
metadata:
  name: multi-test`,
				`apiVersion: v1
kind: ConfigMap
metadata:
  name: config1
  namespace: multi-test
data:
  key: value1`,
				`apiVersion: v1
kind: ConfigMap
metadata:
  name: config2
  namespace: multi-test
data:
  key: value2`,
			},
			wantErr: false,
		},
		{
			name: "empty manifest",
			desc: "Test empty manifest handling",
			manifests: []string{
				"",
			},
			wantErr: false,
		},
		{
			name: "multiple empty documents",
			desc: "Test multiple empty documents separated by ---",
			manifests: []string{
				`---
---
---`,
			},
			wantErr: false,
		},
		{
			name: "invalid yaml",
			desc: "Test invalid YAML syntax handling",
			manifests: []string{
				`invalid: yaml: content: [unclosed`,
			},
			wantErr: true,
			errMsg:  "failed to decode YAML",
		},
		{
			name: "missing required fields",
			desc: "Test manifest with missing kind field",
			manifests: []string{
				`apiVersion: v1
metadata:
  name: test`,
			},
			wantErr: true,
			errMsg:  "failed to decode YAML", // Kubernetes returns decode error for missing required fields
		},
		{
			name: "partial failure with multiple resources",
			desc: "Test partial application with some invalid resources",
			manifests: []string{
				`apiVersion: v1
kind: ConfigMap
metadata:
  name: valid-config
  namespace: default
data:
  key: value
---
invalid: yaml: [unclosed
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: another-valid-config
  namespace: default
data:
  key: value2`,
			},
			wantErr: true,
			errMsg:  "partially applied resources with errors",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Skip if no Kubernetes cluster is available
			kubeconfig := skipIfNoKubeconfig(t)

			// Create client with empty namespace to let manifest namespaces be used
			// (simulates "use namespace from manifest" toggle being ON)
			client, err := NewClient(&ClientAccess{}, "", kubeconfig, false)
			if err != nil {
				t.Fatalf("Failed to create client: %v", err)
			}

			// Register cleanup to delete resources after test completes
			// This runs even if the test fails, ensuring cluster stays clean
			if !tt.wantErr && len(tt.manifests) > 0 {
				t.Cleanup(func() {
					_, err := client.DeleteDynamic(context.Background(), tt.manifests)
					if err != nil {
						t.Logf("Warning: failed to cleanup resources: %v", err)
					}
				})
			}

			output, err := client.ApplyDynamic(context.Background(), tt.manifests)

			if tt.wantErr {
				if err == nil {
					t.Errorf("ApplyDynamic() expected error but got none")
				} else if tt.errMsg != "" && !strings.Contains(err.Error(), tt.errMsg) {
					t.Errorf("ApplyDynamic() error = %v, want error containing %v", err, tt.errMsg)
				}
			} else {
				if err != nil {
					t.Errorf("ApplyDynamic() unexpected error = %v", err)
				}
				if output == "" && len(tt.manifests) > 0 && tt.manifests[0] != "" {
					t.Errorf("ApplyDynamic() expected output but got empty string")
				}
			}
		})
	}
}

// newFakeDynamicClient creates a fake dynamic client that handles Server-Side Apply
func newFakeDynamicClient() *fake.FakeDynamicClient {
	client := fake.NewSimpleDynamicClient(runtime.NewScheme())
	client.PrependReactor("patch", "*", func(action k8stesting.Action) (bool, runtime.Object, error) {
		patchAction := action.(k8stesting.PatchAction)
		if patchAction.GetPatchType() == types.ApplyPatchType {
			obj := &unstructured.Unstructured{}
			if err := obj.UnmarshalJSON(patchAction.GetPatch()); err != nil {
				return true, nil, err
			}
			return true, obj, nil
		}
		return false, nil, nil
	})
	return client
}

// newTestMapper creates a simple RESTMapper for common resource types
func newTestMapper() meta.RESTMapper {
	mapper := meta.NewDefaultRESTMapper([]schema.GroupVersion{
		{Group: "", Version: "v1"},
		{Group: "apps", Version: "v1"},
	})
	mapper.Add(schema.GroupVersionKind{Version: "v1", Kind: "ConfigMap"}, meta.RESTScopeNamespace)
	mapper.Add(schema.GroupVersionKind{Version: "v1", Kind: "Secret"}, meta.RESTScopeNamespace)
	mapper.Add(schema.GroupVersionKind{Version: "v1", Kind: "Namespace"}, meta.RESTScopeRoot)
	mapper.Add(schema.GroupVersionKind{Group: "apps", Version: "v1", Kind: "Deployment"}, meta.RESTScopeNamespace)
	return mapper
}

// TestApplyResource unit tests for applyResource using fake client (no cluster needed)
func TestApplyResource(t *testing.T) {
	client := &Client{} // applyResource doesn't use Client fields directly
	dynamicClient := newFakeDynamicClient()
	mapper := newTestMapper()

	tests := []struct {
		name         string
		yaml         string
		configuredNS string
		wantErr      bool
		errContains  string
	}{
		{
			name: "configmap with configured namespace",
			yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-cm
data:
  key: value`,
			configuredNS: "my-ns",
		},
		{
			name: "configmap with manifest namespace",
			yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-cm
  namespace: manifest-ns
data:
  key: value`,
			configuredNS: "",
		},
		{
			name: "namespace conflict",
			yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-cm
  namespace: manifest-ns`,
			configuredNS: "form-ns",
			wantErr:      true,
			errContains:  "namespace conflict",
		},
		{
			name: "namespaces match",
			yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-cm
  namespace: same-ns`,
			configuredNS: "same-ns",
		},
		{
			name: "defaults to default namespace when neither set",
			yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: test-cm`,
			configuredNS: "",
		},
		{
			name: "cluster-scoped resource ignores namespace",
			yaml: `apiVersion: v1
kind: Namespace
metadata:
  name: new-ns`,
			configuredNS: "ignored",
		},
		{
			name:        "invalid yaml",
			yaml:        "not: valid: yaml: {{",
			wantErr:     true,
			errContains: "failed to decode",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := client.applyResource(context.Background(), dynamicClient, mapper, []byte(tt.yaml), tt.configuredNS)

			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error containing %q, got nil", tt.errContains)
				} else if !strings.Contains(err.Error(), tt.errContains) {
					t.Errorf("expected error containing %q, got %v", tt.errContains, err)
				}
				return
			}
			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if result == "" {
				t.Error("expected non-empty result")
			}
		})
	}
}

func TestIsManifestFile(t *testing.T) {
	tests := []struct {
		name     string
		resource string
		want     bool
	}{
		{
			name:     "yaml file",
			resource: "deployment.yaml",
			want:     true,
		},
		{
			name:     "yml file",
			resource: "deployment.yml",
			want:     true,
		},
		{
			name:     "yaml file with path",
			resource: "/path/to/deployment.yaml",
			want:     true,
		},
		{
			name:     "yaml file with spaces",
			resource: "  deployment.yaml  ",
			want:     true,
		},
		{
			name:     "not a file",
			resource: "apiVersion: v1\nkind: Pod",
			want:     false,
		},
		{
			name:     "resource type",
			resource: "deployment/my-deployment",
			want:     false,
		},
		{
			name:     "empty string",
			resource: "",
			want:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isManifestFile(tt.resource); got != tt.want {
				t.Errorf("isManifestFile() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestBoolPtr(t *testing.T) {
	tests := []struct {
		name string
		val  bool
		want bool
	}{
		{
			name: "true",
			val:  true,
			want: true,
		},
		{
			name: "false",
			val:  false,
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ptr := boolPtr(tt.val)
			if ptr == nil {
				t.Errorf("boolPtr() returned nil")
				return
			}
			if *ptr != tt.want {
				t.Errorf("boolPtr() = %v, want %v", *ptr, tt.want)
			}
		})
	}
}
