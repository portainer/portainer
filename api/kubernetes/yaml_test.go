package kubernetes

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_AddAppLabels(t *testing.T) {
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
			assert.NoError(t, err)
			assert.Equal(t, tt.wantOutput, string(result))
		})
	}
}

func Test_AddAppLabels_HelmApp(t *testing.T) {
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
			assert.NoError(t, err)
			assert.Equal(t, tt.wantOutput, string(result))
		})
	}
}

func Test_DocumentSeperator(t *testing.T) {
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
    io.portainer.kubernetes.application.stack: best-name
    io.portainer.kubernetes.application.stackid: "123"
`
	result, err := AddAppLabels([]byte(input), labels.ToMap())
	assert.NoError(t, err)
	assert.Equal(t, expected, string(result))
}

func Test_GetNamespace(t *testing.T) {
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
  namespace: test-namespace
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
			assert.NoError(t, err)
			assert.Equal(t, tt.want, result)
		})
	}
}

func Test_ExtractDocuments(t *testing.T) {
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
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results, err := ExtractDocuments([]byte(tt.input), nil)
			assert.NoError(t, err)
			for i := range results {
				assert.Equal(t, tt.want[i], string(results[i]))
			}
		})
	}
}
