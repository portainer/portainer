package portainer

import (
	"io"
)

type Connection interface {
	Open() error
	Close() error

	// write the db contents to filename as json (the schema needs defining)
	ExportRaw(filename string) error

	// TODO: this one is very database specific atm
	BackupTo(w io.Writer) error
	GetDatabaseFileName() string
	GetDatabaseFilePath() string
	GetStorePath() string

	IsEncryptedStore() bool
	NeedsEncryptionMigration() (bool, error)
	SetEncrypted(encrypted bool)

	SetServiceName(bucketName string) error
	GetObject(bucketName string, key []byte, object interface{}) error
	UpdateObject(bucketName string, key []byte, object interface{}) error
	DeleteObject(bucketName string, key []byte) error
	DeleteAllObjects(bucketName string, matching func(o interface{}) (id int, ok bool)) error
	GetNextIdentifier(bucketName string) int
	CreateObject(bucketName string, fn func(uint64) (int, interface{})) error
	CreateObjectWithId(bucketName string, id int, obj interface{}) error
	CreateObjectWithStringId(bucketName string, id []byte, obj interface{}) error
	CreateObjectWithSetSequence(bucketName string, id int, obj interface{}) error
	GetAll(bucketName string, obj interface{}, append func(o interface{}) (interface{}, error)) error
	GetAllWithJsoniter(bucketName string, obj interface{}, append func(o interface{}) (interface{}, error)) error
	ConvertToKey(v int) []byte

	BackupMetadata() (map[string]interface{}, error)
	RestoreMetadata(s map[string]interface{}) error
}
