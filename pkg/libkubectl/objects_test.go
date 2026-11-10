package libkubectl

import (
	"os"
	"testing"

	"github.com/stretchr/testify/require"
)

const objectsManifest = `apiVersion: v1
kind: ConfigMap
metadata:
  name: unscoped
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: scoped
  namespace: legacy
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: reader
  namespace: legacy
`

func TestPrepareObjects(t *testing.T) {
	path := t.TempDir() + "/stack.yaml"
	require.NoError(t, os.WriteFile(path, []byte(objectsManifest), 0o600))

	objects, err := PrepareObjects([]string{path}, "")
	require.NoError(t, err)
	require.Len(t, objects, 3)

	require.Equal(t, "default", objects[0].GetNamespace())
	require.Equal(t, "legacy", objects[1].GetNamespace())
	require.True(t, IsClusterScoped(objects[2]))
	require.False(t, IsClusterScoped(objects[0]))
}

func TestPrepareObjects_ConfiguredNamespace(t *testing.T) {
	objects, err := PrepareObjects([]string{"apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: cm\n"}, "team")
	require.NoError(t, err)
	require.Equal(t, "team", objects[0].GetNamespace())

	_, err = PrepareObjects([]string{objectsManifest}, "team")
	require.ErrorContains(t, err, "namespace conflict")
}

func TestPrepareObjects_List(t *testing.T) {
	manifest := `apiVersion: v1
kind: List
items:
- apiVersion: v1
  kind: ConfigMap
  metadata:
    name: first
- apiVersion: v1
  kind: ConfigMap
  metadata:
    name: second
    namespace: legacy
`

	objects, err := PrepareObjects([]string{manifest}, "")
	require.NoError(t, err)
	require.Len(t, objects, 2)
	require.Equal(t, "default", objects[0].GetNamespace())
	require.Equal(t, "legacy", objects[1].GetNamespace())
}

func TestPrepareObjects_Empty(t *testing.T) {
	_, err := PrepareObjects([]string{"# comment only\n"}, "")
	require.Error(t, err)
}
