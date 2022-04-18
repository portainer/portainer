package migrator

func (m *Migrator) migrateDBVersionToDB35() error {
	// These should have been migrated already, but due to an earlier bug and a bunch of duplicates,
	// calling it again will now fix the issue as the function has been repaired.
	migrateLog.Info("- updating dockerhub registries")
	err := m.updateDockerhubToDB32()
	if err != nil {
		return err
	}
	return nil
}
