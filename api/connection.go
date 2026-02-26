package portainer

import (
	"io"
)

type ReadTransaction interface {
	GetObject(bucketName string, key []byte, object any) error
	GetRawBytes(bucketName string, key []byte) ([]byte, error)
	GetAll(bucketName string, obj any, append func(o any) (any, error)) error
	GetAllWithKeyPrefix(bucketName string, keyPrefix []byte, obj any, append func(o any) (any, error)) error
	KeyExists(bucketName string, key []byte) (bool, error)
}

type Transaction interface {
	ReadTransaction

	SetServiceName(bucketName string) error
	UpdateObject(bucketName string, key []byte, object any) error
	DeleteObject(bucketName string, key []byte) error
	CreateObject(bucketName string, fn func(uint64) (int, any)) error
	CreateObjectWithId(bucketName string, id int, obj any) error
	CreateObjectWithStringId(bucketName string, id []byte, obj any) error
	DeleteAllObjects(bucketName string, obj any, matching func(o any) (id int, ok bool)) error
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
	GetDatabaseFileSize() (int64, error)

	IsEncryptedStore() bool
	NeedsEncryptionMigration() (bool, error)
	SetEncrypted(encrypted bool)

	BackupMetadata() (map[string]any, error)
	RestoreMetadata(s map[string]any) error

	UpdateObjectFunc(bucketName string, key []byte, object any, updateFn func()) error
	ConvertToKey(v int) []byte
}
