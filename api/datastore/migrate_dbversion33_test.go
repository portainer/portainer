package datastore

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore/migrator"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/stretchr/testify/assert"
)

func TestMigrateStackEntryPoint(t *testing.T) {
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
		assert.NoError(t, err, "failed to create stack")
	}

	s, err := stackService.Read(1)
	assert.NoError(t, err)
	assert.Nil(t, s.GitConfig, "first stack should not have git config")

	s, err = stackService.Read(2)
	assert.NoError(t, err)
	assert.Equal(t, "", s.GitConfig.ConfigFilePath, "not migrated yet migrated")

	err = migrator.MigrateStackEntryPoint(stackService)
	assert.NoError(t, err, "failed to migrate entry point to Git ConfigFilePath")

	s, err = stackService.Read(1)
	assert.NoError(t, err)
	assert.Nil(t, s.GitConfig, "first stack should not have git config")

	s, err = stackService.Read(2)
	assert.NoError(t, err)
	assert.Equal(t, "dir/sub/compose.yml", s.GitConfig.ConfigFilePath, "second stack should have config file path migrated")
}
