package endpoints

import (
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// spyKubeClient implements portainer.KubeClient for testing applyKubeRegistryAccess.
// It embeds the interface so unimplemented methods panic, and overrides only the
// four methods exercised by applyKubeRegistryAccess.
type spyKubeClient struct {
	portainer.KubeClient

	createSecretErrors     map[string]error
	deleteSecretErrors     map[string]error
	addPullSecretErrors    map[string]error
	removePullSecretErrors map[string]error

	createdSecrets     []string
	deletedSecrets     []string
	addedPullSecrets   []string
	removedPullSecrets []string
}

func newSpyKubeClient() *spyKubeClient {
	return &spyKubeClient{
		createSecretErrors:     make(map[string]error),
		deleteSecretErrors:     make(map[string]error),
		addPullSecretErrors:    make(map[string]error),
		removePullSecretErrors: make(map[string]error),
	}
}

func (s *spyKubeClient) CreateRegistrySecret(_ *portainer.Registry, namespace string) error {
	s.createdSecrets = append(s.createdSecrets, namespace)
	return s.createSecretErrors[namespace]
}

func (s *spyKubeClient) DeleteRegistrySecret(_ portainer.RegistryID, namespace string) error {
	s.deletedSecrets = append(s.deletedSecrets, namespace)
	return s.deleteSecretErrors[namespace]
}

func (s *spyKubeClient) AddImagePullSecretToServiceAccount(namespace, _, _ string) error {
	s.addedPullSecrets = append(s.addedPullSecrets, namespace)
	return s.addPullSecretErrors[namespace]
}

func (s *spyKubeClient) RemoveImagePullSecretFromServiceAccount(namespace, _, _ string) error {
	s.removedPullSecrets = append(s.removedPullSecrets, namespace)
	return s.removePullSecretErrors[namespace]
}

var testRegistry = &portainer.Registry{ID: 3, URL: "registry.example.com"}

func TestApplyKubeRegistryAccess_Grant(t *testing.T) {
	t.Parallel()
	t.Run("single namespace granted creates secret then patches SA", func(t *testing.T) {
		spy := newSpyKubeClient()
		err := applyKubeRegistryAccess(spy, testRegistry, nil, []string{"ns-a"})
		require.NoError(t, err)
		assert.Equal(t, []string{"ns-a"}, spy.createdSecrets)
		assert.Equal(t, []string{"ns-a"}, spy.addedPullSecrets)
		assert.Empty(t, spy.deletedSecrets)
		assert.Empty(t, spy.removedPullSecrets)
	})

	t.Run("multiple namespaces granted applies to all", func(t *testing.T) {
		spy := newSpyKubeClient()
		err := applyKubeRegistryAccess(spy, testRegistry, nil, []string{"ns-a", "ns-b"})
		require.NoError(t, err)
		assert.ElementsMatch(t, []string{"ns-a", "ns-b"}, spy.createdSecrets)
		assert.ElementsMatch(t, []string{"ns-a", "ns-b"}, spy.addedPullSecrets)
	})

	t.Run("CreateRegistrySecret fails - AddImagePullSecret not called", func(t *testing.T) {
		spy := newSpyKubeClient()
		spy.createSecretErrors["ns-a"] = errors.New("secret create failed")
		err := applyKubeRegistryAccess(spy, testRegistry, nil, []string{"ns-a"})
		require.Error(t, err)
		assert.Equal(t, []string{"ns-a"}, spy.createdSecrets)
		assert.Empty(t, spy.addedPullSecrets)
	})

	t.Run("AddImagePullSecret fails after secret created - returns error", func(t *testing.T) {
		spy := newSpyKubeClient()
		spy.addPullSecretErrors["ns-a"] = errors.New("sa patch failed")
		err := applyKubeRegistryAccess(spy, testRegistry, nil, []string{"ns-a"})
		require.Error(t, err)
		assert.Equal(t, []string{"ns-a"}, spy.createdSecrets)
		assert.Equal(t, []string{"ns-a"}, spy.addedPullSecrets)
	})
}

func TestApplyKubeRegistryAccess_Revoke(t *testing.T) {
	t.Parallel()
	t.Run("single namespace revoked removes from SA then deletes secret", func(t *testing.T) {
		spy := newSpyKubeClient()
		err := applyKubeRegistryAccess(spy, testRegistry, []string{"ns-a"}, nil)
		require.NoError(t, err)
		assert.Equal(t, []string{"ns-a"}, spy.removedPullSecrets)
		assert.Equal(t, []string{"ns-a"}, spy.deletedSecrets)
		assert.Empty(t, spy.createdSecrets)
		assert.Empty(t, spy.addedPullSecrets)
	})

	t.Run("multiple namespaces revoked applies to all", func(t *testing.T) {
		spy := newSpyKubeClient()
		err := applyKubeRegistryAccess(spy, testRegistry, []string{"ns-a", "ns-b"}, nil)
		require.NoError(t, err)
		assert.ElementsMatch(t, []string{"ns-a", "ns-b"}, spy.removedPullSecrets)
		assert.ElementsMatch(t, []string{"ns-a", "ns-b"}, spy.deletedSecrets)
	})

	t.Run("RemoveImagePullSecret fails - DeleteRegistrySecret not called", func(t *testing.T) {
		spy := newSpyKubeClient()
		spy.removePullSecretErrors["ns-a"] = errors.New("sa remove failed")
		err := applyKubeRegistryAccess(spy, testRegistry, []string{"ns-a"}, nil)
		require.Error(t, err)
		assert.Equal(t, []string{"ns-a"}, spy.removedPullSecrets)
		assert.Empty(t, spy.deletedSecrets)
	})

	t.Run("DeleteRegistrySecret fails after SA patched - returns error", func(t *testing.T) {
		spy := newSpyKubeClient()
		spy.deleteSecretErrors["ns-a"] = errors.New("secret delete failed")
		err := applyKubeRegistryAccess(spy, testRegistry, []string{"ns-a"}, nil)
		require.Error(t, err)
		assert.Equal(t, []string{"ns-a"}, spy.removedPullSecrets)
		assert.Equal(t, []string{"ns-a"}, spy.deletedSecrets)
	})
}

func TestApplyKubeRegistryAccess_Mixed(t *testing.T) {
	t.Parallel()
	t.Run("one namespace added and one removed in same call", func(t *testing.T) {
		spy := newSpyKubeClient()
		err := applyKubeRegistryAccess(spy, testRegistry, []string{"ns-old"}, []string{"ns-new"})
		require.NoError(t, err)
		assert.Equal(t, []string{"ns-old"}, spy.removedPullSecrets)
		assert.Equal(t, []string{"ns-old"}, spy.deletedSecrets)
		assert.Equal(t, []string{"ns-new"}, spy.createdSecrets)
		assert.Equal(t, []string{"ns-new"}, spy.addedPullSecrets)
	})

	t.Run("empty old and new namespaces - no operations performed", func(t *testing.T) {
		spy := newSpyKubeClient()
		err := applyKubeRegistryAccess(spy, testRegistry, nil, nil)
		require.NoError(t, err)
		assert.Empty(t, spy.createdSecrets)
		assert.Empty(t, spy.deletedSecrets)
		assert.Empty(t, spy.addedPullSecrets)
		assert.Empty(t, spy.removedPullSecrets)
	})

	t.Run("namespace present in both old and new - no operations performed for it", func(t *testing.T) {
		spy := newSpyKubeClient()
		err := applyKubeRegistryAccess(spy, testRegistry, []string{"ns-keep"}, []string{"ns-keep"})
		require.NoError(t, err)
		assert.Empty(t, spy.createdSecrets)
		assert.Empty(t, spy.deletedSecrets)
		assert.Empty(t, spy.addedPullSecrets)
		assert.Empty(t, spy.removedPullSecrets)
	})
}
