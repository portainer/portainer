package migrator

import (
	"github.com/portainer/portainer/api/dataservices"
)

func (m *Migrator) migrateDBVersionToDB34() error {
	migrateLog.Info("- updating stacks")
	err := MigrateStackEntryPoint(m.stackService)
	if err != nil {
		return err
	}

	return nil
}

// MigrateStackEntryPoint exported for testing (blah.)
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
