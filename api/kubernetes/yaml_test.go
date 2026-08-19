package kubernetes

import (
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_AddAppLabels(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name       string
		input      string
		wantOutput string
	}{
		{
			name: "single deployment without labels",
			input: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: busybox
spec:
  replicas: 3
  selector:
    matchLabels:
      app: busybox
  template:
    metadata:
      labels:
        app: busybox
    spec:
      containers:
        - image: busybox
          name: busybox
`,
			wantOutput: `apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    io.portainer.kubernetes.application.kind: git
    io.portainer.kubernetes.application.name: best-name
    io.portainer.kubernetes.application.owner: best-owner
    io.portainer.kubernetes.application.owner.id: ""
    io.portainer.kubernetes.application.stack: best-name
    io.portainer.kubernetes.application.stackid: "123"
  name: busybox
spec:
  replicas: 3
  selector:
    matchLabels:
      app: busybox
  template:
    metadata:
      labels:
        app: busybox
    spec:
      containers:
        - image: busybox
          name: busybox
`,
		},
		{
			name: "single deployment with existing labels",
			input: `apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    foo: bar
  name: busybox
spec:
  replicas: 3
  selector:
    matchLabels:
      app: busybox
  template:
    metadata:
      labels:
        app: busybox
    spec:
      containers:
        - image: busybox
          name: busybox
`,
			wantOutput: `apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    foo: bar
    io.portainer.kubernetes.application.kind: git
    io.portainer.kubernetes.application.name: best-name
    io.portainer.kubernetes.application.owner: best-owner
    io.portainer.kubernetes.application.owner.id: ""
    io.portainer.kubernetes.application.stack: best-name
    io.portainer.kubernetes.application.stackid: "123"
  name: busybox
spec:
  replicas: 3
  selector:
    matchLabels:
      app: busybox
  template:
    metadata:
      labels:
        app: busybox
    spec:
      containers:
        - image: busybox
          name: busybox
`,
		},
		{
			name: "complex kompose output",
			input: `apiVersion: v1
items:
  - apiVersion: v1
    kind: Service
    metadata:
      creationTimestamp: null
      labels:
        io.kompose.service: web
      name: web
    spec:
      ports:
        - name: "5000"
          port: 5000
          targetPort: 5000
      selector:
        io.kompose.service: web
    status:
      loadBalancer: {}
  - apiVersion: apps/v1
    kind: Deployment
    metadata:
      creationTimestamp: null
      labels:
        io.kompose.service: redis
      name: redis
    spec:
      replicas: 1
      selector:
        matchLabels:
          io.kompose.service: redis
      strategy: {}
      template:
        metadata:
          creationTimestamp: null
          labels:
            io.kompose.service: redis
    status: {}
  - apiVersion: apps/v1
    kind: Deployment
    metadata:
      creationTimestamp: null
      name: web
    spec:
      replicas: 1
      selector:
        matchLabels:
          io.kompose.service: web
      strategy:
        type: Recreate
      template:
        metadata:
          creationTimestamp: null
          labels:
            io.kompose.service: web
    status: {}
kind: List
metadata: {}
`,
			wantOutput: `apiVersion: v1
items:
  - apiVersion: v1
    kind: Service
    metadata:
      creationTimestamp: null
      labels:
        io.kompose.service: web
        io.portainer.kubernetes.application.kind: git
        io.portainer.kubernetes.application.name: best-name
        io.portainer.kubernetes.application.owner: best-owner
        io.portainer.kubernetes.application.owner.id: ""
        io.portainer.kubernetes.application.stack: best-name
        io.portainer.kubernetes.application.stackid: "123"
      name: web
    spec:
      ports:
        - name: "5000"
          port: 5000
          targetPort: 5000
      selector:
        io.kompose.service: web
    status:
      loadBalancer: {}
  - apiVersion: apps/v1
    kind: Deployment
    metadata:
      creationTimestamp: null
      labels:
        io.kompose.service: redis
        io.portainer.kubernetes.application.kind: git
        io.portainer.kubernetes.application.name: best-name
        io.portainer.kubernetes.application.owner: best-owner
        io.portainer.kubernetes.application.owner.id: ""
        io.portainer.kubernetes.application.stack: best-name
        io.portainer.kubernetes.application.stackid: "123"
      name: redis
    spec:
      replicas: 1
      selector:
        matchLabels:
          io.kompose.service: redis
      strategy: {}
      template:
        metadata:
          creationTimestamp: null
          labels:
            io.kompose.service: redis
    status: {}
  - apiVersion: apps/v1
    kind: Deployment
    metadata:
      creationTimestamp: null
      labels:
        io.portainer.kubernetes.application.kind: git
        io.portainer.kubernetes.application.name: best-name
        io.portainer.kubernetes.application.owner: best-owner
        io.portainer.kubernetes.application.owner.id: ""
        io.portainer.kubernetes.application.stack: best-name
        io.portainer.kubernetes.application.stackid: "123"
      name: web
    spec:
      replicas: 1
      selector:
        matchLabels:
          io.kompose.service: web
      strategy:
        type: Recreate
      template:
        metadata:
          creationTimestamp: null
          labels:
            io.kompose.service: web
    status: {}
kind: List
metadata: {}
`,
		},
		{
			name: "multiple items separated by ---",
			input: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: busybox
spec:
  replicas: 3
  selector:
    matchLabels:
      app: busybox
  template:
    metadata:
      labels:
        app: busybox
    spec:
      containers:
        - image: busybox
          name: busybox
---
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    io.kompose.service: web
  name: web
spec:
  ports:
    - name: "5000"
      port: 5000
      targetPort: 5000
  selector:
    io.kompose.service: web
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    foo: bar
  name: busybox
spec:
  replicas: 3
  selector:
    matchLabels:
      app: busybox
  template:
    metadata:
      labels:
        app: busybox
    spec:
      containers:
        - image: busybox
          name: busybox
`,
			wantOutput: `apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    io.portainer.kubernetes.application.kind: git
    io.portainer.kubernetes.application.name: best-name
    io.portainer.kubernetes.application.owner: best-owner
    io.portainer.kubernetes.application.owner.id: ""
    io.portainer.kubernetes.application.stack: best-name
    io.portainer.kubernetes.application.stackid: "123"
  name: busybox
spec:
  replicas: 3
  selector:
    matchLabels:
      app: busybox
  template:
    metadata:
      labels:
        app: busybox
    spec:
      containers:
        - image: busybox
          name: busybox
---
apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    io.kompose.service: web
    io.portainer.kubernetes.application.kind: git
    io.portainer.kubernetes.application.name: best-name
    io.portainer.kubernetes.application.owner: best-owner
    io.portainer.kubernetes.application.owner.id: ""
    io.portainer.kubernetes.application.stack: best-name
    io.portainer.kubernetes.application.stackid: "123"
  name: web
spec:
  ports:
    - name: "5000"
      port: 5000
      targetPort: 5000
  selector:
    io.kompose.service: web
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    foo: bar
    io.portainer.kubernetes.application.kind: git
    io.portainer.kubernetes.application.name: best-name
    io.portainer.kubernetes.application.owner: best-owner
    io.portainer.kubernetes.application.owner.id: ""
    io.portainer.kubernetes.application.stack: best-name
    io.portainer.kubernetes.application.stackid: "123"
  name: busybox
spec:
  replicas: 3
  selector:
    matchLabels:
      app: busybox
  template:
    metadata:
      labels:
        app: busybox
    spec:
      containers:
        - image: busybox
          name: busybox
`,
		},
		{
			name:       "empty",
			input:      "",
			wantOutput: "",
		},
		{
			name: "no only deployments",
			input: `apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    io.kompose.service: web
  name: web
spec:
  ports:
    - name: "5000"
      port: 5000
      targetPort: 5000
  selector:
    io.kompose.service: web
`,
			wantOutput: `apiVersion: v1
kind: Service
metadata:
  creationTimestamp: null
  labels:
    io.kompose.service: web
    io.portainer.kubernetes.application.kind: git
    io.portainer.kubernetes.application.name: best-name
    io.portainer.kubernetes.application.owner: best-owner
    io.portainer.kubernetes.application.owner.id: ""
    io.portainer.kubernetes.application.stack: best-name
    io.portainer.kubernetes.application.stackid: "123"
  name: web
spec:
  ports:
    - name: "5000"
      port: 5000
      targetPort: 5000
  selector:
    io.kompose.service: web
`,
		},
	}

	labels := KubeAppLabels{
		StackID:   123,
		StackName: "best-name",
		Owner:     "best-owner",
		Kind:      "git",
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := AddAppLabels([]byte(tt.input), labels.ToMap())
			require.NoError(t, err)
			assert.Equal(t, tt.wantOutput, string(result))
		})
	}
}

func Test_AddAppLabels_HelmApp(t *testing.T) {
	t.Parallel()
	labels := GetHelmAppLabels("best-name", "best-owner")

	tests := []struct {
		name       string
		input      string
		wantOutput string
	}{
		{
			name: "bitnami nginx configmap",
			input: `apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-test-server-block
  labels:
    app.kubernetes.io/name: nginx
    helm.sh/chart: nginx-9.5.4
    app.kubernetes.io/instance: nginx-test
    app.kubernetes.io/managed-by: Helm
data:
  server-blocks-paths.conf: |-
    include  "/opt/bitnami/nginx/conf/server_blocks/ldap/*.conf";
    include  "/opt/bitnami/nginx/conf/server_blocks/common/*.conf";
`,
			wantOutput: `apiVersion: v1
data:
  server-blocks-paths.conf: |-
    include  "/opt/bitnami/nginx/conf/server_blocks/ldap/*.conf";
    include  "/opt/bitnami/nginx/conf/server_blocks/common/*.conf";
kind: ConfigMap
metadata:
  labels:
    app.kubernetes.io/instance: nginx-test
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/name: nginx
    helm.sh/chart: nginx-9.5.4
    io.portainer.kubernetes.application.name: best-name
    io.portainer.kubernetes.application.owner: best-owner
  name: nginx-test-server-block
`,
		},
		{
			name: "bitnami nginx service",
			input: `apiVersion: v1
kind: Service
metadata:
  name: nginx-test
  labels:
    app.kubernetes.io/name: nginx
    helm.sh/chart: nginx-9.5.4
    app.kubernetes.io/instance: nginx-test
    app.kubernetes.io/managed-by: Helm
spec:
  type: LoadBalancer
  externalTrafficPolicy: "Cluster"
  ports:
    - name: http
      port: 80
      targetPort: http
  selector:
    app.kubernetes.io/name: nginx
    app.kubernetes.io/instance: nginx-test
`,
			wantOutput: `apiVersion: v1
kind: Service
metadata:
  labels:
    app.kubernetes.io/instance: nginx-test
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/name: nginx
    helm.sh/chart: nginx-9.5.4
    io.portainer.kubernetes.application.name: best-name
    io.portainer.kubernetes.application.owner: best-owner
  name: nginx-test
spec:
  externalTrafficPolicy: Cluster
  ports:
    - name: http
      port: 80
      targetPort: http
  selector:
    app.kubernetes.io/instance: nginx-test
    app.kubernetes.io/name: nginx
  type: LoadBalancer
`,
		},
		{
			name: "bitnami nginx deployment",
			input: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-test
  labels:
    app.kubernetes.io/name: nginx
    helm.sh/chart: nginx-9.5.4
    app.kubernetes.io/instance: nginx-test
    app.kubernetes.io/managed-by: Helm
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: nginx
      app.kubernetes.io/instance: nginx-test
  template:
    metadata:
      labels:
        app.kubernetes.io/name: nginx
        helm.sh/chart: nginx-9.5.4
        app.kubernetes.io/instance: nginx-test
        app.kubernetes.io/managed-by: Helm
    spec:
      automountServiceAccountToken: false
      shareProcessNamespace: false
      serviceAccountName: default
      containers:
        - name: nginx
          image: docker.io/bitnami/nginx:1.21.3-debian-10-r0
          imagePullPolicy: "IfNotPresent"
`,
			wantOutput: `apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app.kubernetes.io/instance: nginx-test
    app.kubernetes.io/managed-by: Helm
    app.kubernetes.io/name: nginx
    helm.sh/chart: nginx-9.5.4
    io.portainer.kubernetes.application.name: best-name
    io.portainer.kubernetes.application.owner: best-owner
  name: nginx-test
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/instance: nginx-test
      app.kubernetes.io/name: nginx
  template:
    metadata:
      labels:
        app.kubernetes.io/instance: nginx-test
        app.kubernetes.io/managed-by: Helm
        app.kubernetes.io/name: nginx
        helm.sh/chart: nginx-9.5.4
    spec:
      automountServiceAccountToken: false
      containers:
        - image: docker.io/bitnami/nginx:1.21.3-debian-10-r0
          imagePullPolicy: IfNotPresent
          name: nginx
      serviceAccountName: default
      shareProcessNamespace: false
`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := AddAppLabels([]byte(tt.input), labels)
			require.NoError(t, err)
			assert.Equal(t, tt.wantOutput, string(result))
		})
	}
}

func Test_DocumentSeperator(t *testing.T) {
	t.Parallel()
	labels := KubeAppLabels{
		StackID:   123,
		StackName: "best-name",
		Owner:     "best-owner",
		Kind:      "git",
	}

	input := `apiVersion: v1
kind: Service
metadata:
  labels:
    io.kompose.service: database
---
apiVersion: v1
kind: Service
metadata:
  labels:
    io.kompose.service: backend
`
	expected := `apiVersion: v1
kind: Service
metadata:
  labels:
    io.kompose.service: database
    io.portainer.kubernetes.application.kind: git
    io.portainer.kubernetes.application.name: best-name
    io.portainer.kubernetes.application.owner: best-owner
    io.portainer.kubernetes.application.owner.id: ""
    io.portainer.kubernetes.application.stack: best-name
    io.portainer.kubernetes.application.stackid: "123"
---
apiVersion: v1
kind: Service
metadata:
  labels:
    io.kompose.service: backend
    io.portainer.kubernetes.application.kind: git
    io.portainer.kubernetes.application.name: best-name
    io.portainer.kubernetes.application.owner: best-owner
    io.portainer.kubernetes.application.owner.id: ""
    io.portainer.kubernetes.application.stack: best-name
    io.portainer.kubernetes.application.stackid: "123"
`
	result, err := AddAppLabels([]byte(input), labels.ToMap())
	require.NoError(t, err)
	assert.Equal(t, expected, string(result))
}

func Test_GetNamespace(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name  string
		input string
		want  string
	}{
		{
			name: "valid namespace",
			input: `apiVersion: v1
kind: Namespace
metadata:
  name: test-namespace
`,
			want: "test-namespace",
		},
		{
			name: "invalid namespace",
			input: `apiVersion: v1
kind: Namespace
`,
			want: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := GetNamespace([]byte(tt.input))
			require.NoError(t, err)
			assert.Equal(t, tt.want, result)
		})
	}
}

func Test_ExtractDocuments(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name  string
		input string
		want  []string
	}{
		{
			name: "multiple documents",
			input: `apiVersion: v1
kind: Namespace
---
apiVersion: v1
kind: Service
`,
			want: []string{`apiVersion: v1
kind: Namespace
`, `apiVersion: v1
kind: Service
`},
		},
		{
			name: "single document",
			input: `apiVersion: v1
kind: Namespace
`,
			want: []string{`apiVersion: v1
kind: Namespace
`},
		},
		{
			name: "empty document separator is skipped",
			input: `apiVersion: v1
kind: Namespace
---
---
apiVersion: v1
kind: Service
`,
			want: []string{`apiVersion: v1
kind: Namespace
`, `apiVersion: v1
kind: Service
`},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results, err := ExtractDocuments([]byte(tt.input), nil)
			require.NoError(t, err)

			for i := range results {
				assert.Equal(t, tt.want[i], string(results[i]))
			}
		})
	}
}

func Test_ExtractDocuments_PostProcess(t *testing.T) {
	t.Parallel()

	input := `apiVersion: v1
kind: Namespace
metadata:
  name: test
`

	t.Run("post-process callback is applied to each document", func(t *testing.T) {
		called := 0
		result, err := ExtractDocuments([]byte(input), func(doc any) error {
			called++
			m := doc.(map[string]any)
			m["injected"] = "value"
			return nil
		})
		require.NoError(t, err)
		assert.Equal(t, 1, called)
		assert.Contains(t, string(result[0]), "injected")
	})

	t.Run("post-process callback error is returned", func(t *testing.T) {
		_, err := ExtractDocuments([]byte(input), func(any) error {
			return errors.New("post-process failed")
		})
		require.ErrorContains(t, err, "post-process failed")
	})
}

// Test_ExtractDocuments_MalformedYAML is a regression test for the infinite loop
// described in https://github.com/portainer/portainer/issues/13051.
// Previously, a malformed YAML document (bad indentation) caused Decode() to
// return both err != nil and m == nil. The pre-fix implementation checked
// m == nil first and continued, skipping the EOF check and looping forever.
func Test_ExtractDocuments_MalformedYAML(t *testing.T) {
	malformedYAML := `---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: error
spec:
  replicas: 1
  selector:
    matchLabels:
      app: error
  template:
    metadata:
      labels:
        app: error
    spec:
      containers:
        - name: alpine
          image: alpine:latest
          command: [ "/bin/bash", "-c" ]
          args:
            - |
            echo "crash"
`

	done := make(chan error, 1)
	go func() {
		_, err := ExtractDocuments([]byte(malformedYAML), nil)
		done <- err
	}()

	select {
	case err := <-done:
		// Should return an error, not hang
		require.Error(t, err, "expected an error for malformed YAML, not a hang")
	case <-time.After(3 * time.Second):
		t.Fatal("ExtractDocuments hung on malformed YAML (infinite loop — issue #13051 reproduced)")
	}
}
