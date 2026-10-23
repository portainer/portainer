package deployments

import (
	"encoding/base64"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/require"
)

func Test_unpackerImageRegistryAuth(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	d := NewStackDeployer(nil, nil, nil, nil, store)

	err := store.Registry().Create(&portainer.Registry{
		ID:             1,
		Type:           portainer.CustomRegistry,
		URL:            "myregistry.example.com",
		Authentication: true,
		Username:       "someuser",
		Password:       "somepass",
	})
	require.NoError(t, err, "failed to create a test registry")

	err = store.Registry().Create(&portainer.Registry{
		ID:   2,
		Type: portainer.CustomRegistry,
		URL:  "noauth.example.com",
	})
	require.NoError(t, err, "failed to create a test registry")

	// an unparsable image name is rejected before any registry lookup happens
	auth, err := d.unpackerImageRegistryAuth("INVALID IMAGE NAME")
	require.Error(t, err)
	require.Empty(t, auth)

	// no registry matches this image, so callers must fall back to an unauthenticated pull
	auth, err = d.unpackerImageRegistryAuth("unmatched.example.com/portainer/compose-unpacker:2.0.0")
	require.Error(t, err)
	require.Empty(t, auth)

	// the matching registry has authentication disabled, so callers must fall back to an unauthenticated pull
	auth, err = d.unpackerImageRegistryAuth("noauth.example.com/portainer/compose-unpacker:2.0.0")
	require.Error(t, err)
	require.Empty(t, auth)

	// the matching registry has authentication enabled, so callers get an encoded basic-auth header
	auth, err = d.unpackerImageRegistryAuth("myregistry.example.com/portainer/compose-unpacker:2.0.0")
	require.NoError(t, err)
	require.NotEmpty(t, auth)

	decoded, err := base64.StdEncoding.DecodeString(auth)
	require.NoError(t, err)
	require.Contains(t, string(decoded), "someuser")
	require.Contains(t, string(decoded), "somepass")
}

func Test_resolveUnpackerRegistryAuth(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, true)

	d := NewStackDeployer(nil, nil, nil, nil, store)

	// no registry matches, so resolveUnpackerRegistryAuth swallows the error and returns an empty auth
	require.Empty(t, d.resolveUnpackerRegistryAuth("unmatched.example.com/portainer/compose-unpacker:2.0.0"))

	err := store.Registry().Create(&portainer.Registry{
		ID:             1,
		Type:           portainer.CustomRegistry,
		URL:            "resolveauth.example.com",
		Authentication: true,
		Username:       "someuser",
		Password:       "somepass",
	})
	require.NoError(t, err, "failed to create a test registry")

	auth := d.resolveUnpackerRegistryAuth("resolveauth.example.com/portainer/compose-unpacker:2.0.0")
	require.NotEmpty(t, auth)

	decoded, err := base64.StdEncoding.DecodeString(auth)
	require.NoError(t, err)
	require.Contains(t, string(decoded), "someuser")
}
