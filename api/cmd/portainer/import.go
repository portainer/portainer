package main

import (
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"

	"github.com/rs/zerolog/log"
)

func importFromJson(fileService portainer.FileService, store *datastore.Store) {
	// EXPERIMENTAL - if used with an incomplete json file, it will fail, as we don't have a way to default the model values
	importFile := "/data/import.json"
	if exists, _ := fileService.FileExists(importFile); exists {
		if err := store.Import(importFile); err != nil {
			log.Error().Str("filename", importFile).Err(err).Msg("import failed")
			// TODO: should really rollback on failure, but then we have nothing.
		} else {
			log.Info().Str("filename", importFile).Msg("successfully imported the file to a new portainer database")
		}

		// TODO: this is bad - its to ensure that any defaults that were broken in import, or migrations get set back to what we want
		// I also suspect that everything from "Init to Init" is potentially a migration
		err := store.Init()
		if err != nil {
			log.Fatal().Err(err).Msg("failed initializing data store")
		}
	}
}
