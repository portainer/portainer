package sqlite

import (
	"errors"
	"os"
	"path"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/models"
	"github.com/rs/zerolog/log"
)

const (
	DatabaseFileName          = "portainer.db"
	EncryptedDatabaseFileName = "portainer.edb"
)

var (
	ErrHaveEncryptedAndUnencrypted = errors.New("Portainer has detected both an encrypted and un-encrypted database and cannot start.  Only one database should exist")
	ErrHaveEncryptedWithNoKey      = errors.New("The portainer database is encrypted, but no secret was loaded")
)

type DbConnection struct {
	Path          string
	EncryptionKey []byte
	isEncrypted   bool

	*gorm.DB
}

func (connection *DbConnection) GetDB() *gorm.DB {
	if connection.DB == nil {
		err := connection.Open()
		if err != nil {
			panic(err)
		}
	}
	return connection.DB
}

// GetDatabaseFileName get the database filename
func (connection *DbConnection) GetDatabaseFileName() string {
	if connection.IsEncryptedStore() {
		return EncryptedDatabaseFileName
	}

	return DatabaseFileName
}

// GetDataseFilePath get the path + filename for the database file
func (connection *DbConnection) GetDatabaseFilePath() string {
	if connection.IsEncryptedStore() {
		return path.Join(connection.Path, EncryptedDatabaseFileName)
	}

	return path.Join(connection.Path, DatabaseFileName)
}

// GetStorePath get the filename and path for the database file
func (connection *DbConnection) GetStorePath() string {
	return connection.Path
}

// Return true if the database is encrypted
func (connection *DbConnection) IsEncryptedStore() bool {
	return connection.getEncryptionKey() != nil
}

func (connection *DbConnection) SetEncrypted(encrypted bool) {
	connection.isEncrypted = encrypted
}

// NeedsEncryptionMigration returns true if database encryption is enabled and
// we have an un-encrypted DB that requires migration to an encrypted DB
func (connection *DbConnection) NeedsEncryptionMigration() (bool, error) {

	// Cases:  Note, we need to check both portainer.db and portainer.edb
	// to determine if it's a new store.   We only need to differentiate between cases 2,3 and 5

	// 1) portainer.edb + key     => False
	// 2) portainer.edb + no key  => ERROR Fatal!
	// 3) portainer.db  + key     => True  (needs migration)
	// 4) portainer.db  + no key  => False
	// 5) NoDB (new)    + key     => False
	// 6) NoDB (new)    + no key  => False
	// 7) portainer.db & portainer.edb => ERROR Fatal!

	// If we have a loaded encryption key, always set encrypted
	if connection.EncryptionKey != nil {
		connection.SetEncrypted(true)
	}

	// Check for portainer.db
	dbFile := path.Join(connection.Path, DatabaseFileName)
	_, err := os.Stat(dbFile)
	haveDbFile := err == nil

	// Check for portainer.edb
	edbFile := path.Join(connection.Path, EncryptedDatabaseFileName)
	_, err = os.Stat(edbFile)
	haveEdbFile := err == nil

	if haveDbFile && haveEdbFile {
		// 7 - encrypted and unencrypted db?
		return false, ErrHaveEncryptedAndUnencrypted
	}

	if haveDbFile && connection.EncryptionKey != nil {
		// 3 - needs migration
		return true, nil
	}

	if haveEdbFile && connection.EncryptionKey == nil {
		// 2 - encrypted db, but no key?
		return false, ErrHaveEncryptedWithNoKey
	}

	// 1, 4, 5, 6
	return false, nil
}

// Open opens and initializes the BoltDB database.
func (connection *DbConnection) Open() error {

	log.Info().Str("filename", connection.GetDatabaseFileName()).Msg("loading PortainerDB")

	// Now we open the db
	databasePath := connection.GetDatabaseFilePath()

	db, err := gorm.Open(sqlite.Open(databasePath), &gorm.Config{})
	if err != nil {
		return err
	}
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	sqlDB.SetMaxOpenConns(5)
	sqlDB.SetMaxOpenConns(10)
	connection.DB = db

	return nil
}

func (connection *DbConnection) Close() error {
	sqlDB, err := connection.DB.DB()
	if err != nil {
		return err
	}
	connection.DB = nil
	return sqlDB.Close()
}

func (connection *DbConnection) getEncryptionKey() []byte {
	if !connection.isEncrypted {
		return nil
	}

	return connection.EncryptionKey
}

func (connection *DbConnection) Init() error {
	connection.DB.AutoMigrate(&models.Version{})
	connection.DB.AutoMigrate(&portainer.Settings{})
	return nil
}
