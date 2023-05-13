package portainer

import "gorm.io/gorm"

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
	Open() error
	Close() error
	Init() error
	GetDB() *gorm.DB

	GetByID(ID int, obj interface{}) error
	DeleteByID(ID int, obj interface{}) error

	// TODO: this one is very database specific atm
	GetDatabaseFileName() string
	GetDatabaseFilePath() string
	GetStorePath() string

	IsEncryptedStore() bool
	NeedsEncryptionMigration() (bool, error)
	SetEncrypted(encrypted bool)
}
