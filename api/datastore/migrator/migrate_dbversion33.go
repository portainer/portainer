package migrator

import (
	"github.com/portainer/portainer/api/dataservices"

	"github.com/rs/zerolog/log"
)

func (m *Migrator) migrateDBVersionToDB34() error {
	log.Info().Msg("updating stacks")

	return MigrateStackEntryPoint(m.stackService)
}

// MigrateStackEntryPoint exported for testing
func MigrateStackEntryPoint(stackService dataservices.StackService) error {
	stacks, err := stackService.Stacks()
	if err != nil {
		return err
	}

	for i := range stacks {
		stack := &stacks[i]
		if stack.GitConfig == nil {
			continue
		}

		stack.GitConfig.ConfigFilePath = stack.EntryPoint
		if err := stackService.UpdateStack(stack.ID, stack); err != nil {
			return err
		}
	}

	return nil
}
