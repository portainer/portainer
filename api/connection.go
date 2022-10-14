package portainer

import "gorm.io/gorm"

type Connection interface {
	Open() error
	Close() error

	Init() error

	GetDB() *gorm.DB

	GetDatabaseFileName() string
	GetDatabaseFilePath() string
	GetStorePath() string

	SetEncrypted(encrypted bool)
	IsEncryptedStore() bool
	NeedsEncryptionMigration() (bool, error)
}
