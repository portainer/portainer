package portainer

import (
	"io"
)

type ReadTransaction interface {
	GetObject(bucketName string, key []byte, object interface{}) error
	GetAll(bucketName string, obj interface{}, append func(o interface{}) (interface{}, error)) error
	GetAllWithJsoniter(bucketName string, obj interface{}, append func(o interface{}) (interface{}, error)) error
	GetAllWithKeyPrefix(bucketName string, keyPrefix []byte, obj interface{}, append func(o interface{}) (interface{}, error)) error
}

type Transaction interface {
	ReadTransaction

	SetServiceName(bucketName string) error
	UpdateObject(bucketName string, key []byte, object interface{}) error
	DeleteObject(bucketName string, key []byte) error
	CreateObject(bucketName string, fn func(uint64) (int, interface{})) error
	CreateObjectWithId(bucketName string, id int, obj interface{}) error
	CreateObjectWithStringId(bucketName string, id []byte, obj interface{}) error
	DeleteAllObjects(bucketName string, obj interface{}, matching func(o interface{}) (id int, ok bool)) error
	GetNextIdentifier(bucketName string) int
}

type Connection interface {
	Transaction

	Open() error
	Close() error

	UpdateTx(fn func(Transaction) error) error
	ViewTx(fn func(Transaction) error) error

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

	BackupMetadata() (map[string]interface{}, error)
	RestoreMetadata(s map[string]interface{}) error

	UpdateObjectFunc(bucketName string, key []byte, object any, updateFn func()) error
	ConvertToKey(v int) []byte
}
