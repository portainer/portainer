package migrator

import "github.com/rs/zerolog/log"

func (m *Migrator) migrateDBVersionToDB35() error {
	// These should have been migrated already, but due to an earlier bug and a bunch of duplicates,
	// calling it again will now fix the issue as the function has been repaired.

	log.Info().Msg("updating dockerhub registries")

	return m.updateDockerhubToDB32()
}
