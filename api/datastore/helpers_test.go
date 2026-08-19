package datastore

import (
	"path/filepath"
	"testing"

	portainer "github.com/portainer/portainer/api"

	"github.com/rs/zerolog/log"
)

// isFileExist is helper function to check for file existence
func isFileExist(path string) bool {
	matches, err := filepath.Glob(path)
	if err != nil {
		return false
	}
	return len(matches) > 0
}

func updateVersion(store *Store, v string) {
	version, err := store.VersionService.Version()
	if err != nil {
		log.Fatal().Err(err).Msg("")
	}

	version.SchemaVersion = v

	err = store.VersionService.UpdateVersion(version)
	if err != nil {
		log.Fatal().Err(err).Msg("")
	}
}

func updateEdition(store *Store, edition portainer.SoftwareEdition) {
	version, err := store.VersionService.Version()
	if err != nil {
		log.Fatal().Err(err).Msg("")
	}

	version.Edition = int(edition)

	err = store.VersionService.UpdateVersion(version)
	if err != nil {
		log.Fatal().Err(err).Msg("")
	}
}

// testVersion is a helper which tests current store version against wanted version
func testVersion(store *Store, versionWant string, t *testing.T) {
	v, err := store.VersionService.Version()
	if err != nil {
		log.Fatal().Err(err).Msg("")
	}
	if v.SchemaVersion != versionWant {
		t.Errorf("Expect store version to be %s but was %s", versionWant, v.SchemaVersion)
	}
}
