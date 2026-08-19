package datastore

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrator"
	gittypes "github.com/portainer/portainer/api/git/types"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMigrateStackEntryPoint(t *testing.T) {
	t.Parallel()
	_, store := MustNewTestStore(t, false, true)

	stackService := store.Stack()

	stacks := []*portainer.Stack{
		{
			ID:         1,
			EntryPoint: "dir/sub/compose.yml",
		},
		{
			ID:         2,
			EntryPoint: "dir/sub/compose.yml",
			GitConfig:  &gittypes.RepoConfig{},
		},
	}

	for _, s := range stacks {
		err := stackService.Create(s)
		require.NoError(t, err, "failed to create stack")
	}

	s, err := stackService.Read(1)
	require.NoError(t, err)
	assert.Nil(t, s.GitConfig, "first stack should not have git config")

	s, err = stackService.Read(2)
	require.NoError(t, err)
	assert.Empty(t, s.GitConfig.ConfigFilePath, "not migrated yet migrated")

	err = migrator.MigrateStackEntryPoint(stackService)
	require.NoError(t, err, "failed to migrate entry point to Git ConfigFilePath")

	s, err = stackService.Read(1)
	require.NoError(t, err)
	assert.Nil(t, s.GitConfig, "first stack should not have git config")

	s, err = stackService.Read(2)
	require.NoError(t, err)
	assert.Equal(t, "dir/sub/compose.yml", s.GitConfig.ConfigFilePath, "second stack should have config file path migrated")
}
