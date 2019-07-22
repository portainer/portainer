package database

import (
	"github.com/boltdb/bolt"
	//"strconv"
	//"net/http"
	//"io/ioutil"
)

const (
	databaseFileName = "portainer.db"
)

// Service represents a service for managing Database.
type Service struct{}

// DatabaseExport makes the BoltDB into read only mode, takes a backup and then put it back to writable mode.
func (service *Service) DatabaseExport(storePath string) (int64, error) {
	//var databaseExport int64
	//var w http.ResponseWriter
	// var r io.Reader
	dataStorePath := storePath + "/" + databaseFileName

	_, err := bolt.Open(dataStorePath, 0666, &bolt.Options{ReadOnly: true})
	
	/*
	db, err := bolt.Open(dataStorePath, 0666, &bolt.Options{ReadOnly: true})
	if err != nil {
		return 0, err
	}
	
	err := db.View(func(tx *bolt.Tx) error {
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Header().Set("Content-Disposition", `attachment; filename="portainer.db"`)
		w.Header().Set("Content-Length", strconv.Itoa(int(tx.Size())))	
		databaseExport, err := tx.WriteTo(w)
		return nil
	})
	if err != nil {
		return 0, err
	}
	*/
	return 0, err
}