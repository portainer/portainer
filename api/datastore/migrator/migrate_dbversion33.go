package migrator

import (
	"fmt"

	"github.com/portainer/portainer/api/dataservices"
)

func (m *Migrator) migrateDBVersionToDB34() error {
	migrateLog.Info("Migrating stacks")
	err := MigrateStackEntryPoint(m.stackService)
	if err != nil {
		return err
	}

	return validateStackEntryPoint(m.stackService)
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

// validateStackEntryPoint validates if MigrateStackEntryPoint was successful
func validateStackEntryPoint(stackService dataservices.StackService) error {
	stacks, err := stackService.Stacks()
	if err != nil {
		return err
	}
	for i := range stacks {
		stack := &stacks[i]
		if stack.GitConfig == nil {
			continue
		}
		if stack.GitConfig.ConfigFilePath == "" {
			return fmt.Errorf("GitConfig.ConfigFilePath is empty for stack - name=%s, ID=%d", stack.Name, stack.ID)
		}
	}
	return nil
}
