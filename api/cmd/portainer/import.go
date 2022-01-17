package main

import (
	"log"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/sirupsen/logrus"
)

func importFromJson(fileService portainer.FileService, store *datastore.Store) {
	// EXPERIMENTAL - if used with an incomplete json file, it will fail, as we don't have a way to default the model values
	importFile := "/data/import.json"
	if exists, _ := fileService.FileExists(importFile); exists {
		if err := store.Import(importFile); err != nil {
			logrus.WithError(err).Debugf("Import %s failed", importFile)

			// TODO: should really rollback on failure, but then we have nothing.
		} else {
			logrus.Printf("Successfully imported %s to new portainer database", importFile)
		}
		// TODO: this is bad - its to ensure that any defaults that were broken in import, or migrations get set back to what we want
		// I also suspect that everything from "Init to Init" is potentially a migration
		err := store.Init()
		if err != nil {
			log.Fatalf("Failed initializing data store: %v", err)
		}
	}
}
