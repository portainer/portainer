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
		StackID: 123,
		Name:    "best-name",
		Owner:   "best-owner",
		Kind:    "git",
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := AddAppLabels([]byte(tt.input), labels)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantOutput, string(result))
		})
	}
}

func Test_AddAppLabels_PickingName_WhenLabelNameIsEmpty(t *testing.T) {
	labels := KubeAppLabels{
		StackID: 123,
		Owner:   "best-owner",
		Kind:    "git",
	}

	input := `apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  ports:
    - name: "5000"
      port: 5000
      targetPort: 5000
`

	expected := `apiVersion: v1
kind: Service
metadata:
  labels:
    io.portainer.kubernetes.application.kind: git
    io.portainer.kubernetes.application.name: web
    io.portainer.kubernetes.application.owner: best-owner
    io.portainer.kubernetes.application.stackid: "123"
  name: web
spec:
  ports:
    - name: "5000"
      port: 5000
      targetPort: 5000
`

	result, err := AddAppLabels([]byte(input), labels)
	assert.NoError(t, err)
	assert.Equal(t, expected, string(result))
}

func Test_AddAppLabels_PickingName_WhenLabelAndMetadataNameAreEmpty(t *testing.T) {
	labels := KubeAppLabels{
		StackID: 123,
		Owner:   "best-owner",
		Kind:    "git",
	}

	input := `apiVersion: v1
kind: Service
spec:
  ports:
    - name: "5000"
      port: 5000
      targetPort: 5000
`

	expected := `apiVersion: v1
kind: Service
metadata:
  labels:
    io.portainer.kubernetes.application.kind: git
    io.portainer.kubernetes.application.name: ""
    io.portainer.kubernetes.application.owner: best-owner
    io.portainer.kubernetes.application.stackid: "123"
spec:
  ports:
    - name: "5000"
      port: 5000
      targetPort: 5000
`

	result, err := AddAppLabels([]byte(input), labels)
	assert.NoError(t, err)
	assert.Equal(t, expected, string(result))
}
