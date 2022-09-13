package migrator

func (m *Migrator) migrateDBVersionToDB70() error {
	if err := m.addLogoFieldToStackDB70(); err != nil {
		return err
	}

	return nil
}

func (m *Migrator) addLogoFieldToStackDB70() error {
	migrateLog.Info("- add Logo field to Stack")
	stacks, err := m.stackService.Stacks()
	if err != nil {
		return err
	}

	for _, stack := range stacks {
		stack.Logo = ""
		err = m.stackService.UpdateStack(stack.ID, &stack)
		if err != nil {
			return err
		}

	}

	return nil
}
