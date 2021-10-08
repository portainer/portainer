package datastore

type Connection interface {
	CreateBucket(bucketName string) error
	GetObject(bucketName string, key []byte, object interface{}) error
	UpdateObject(bucketName string, key []byte, object interface{}) error
	DeleteObject(bucketName string, key []byte) error
	DeleteAllObjects(bucketName string, matching func(o interface{}) (id int, ok bool)) error
	GetNextIdentifier(bucketName string) int
	CreateObject(bucketName string, fn func(uint64) (int, interface{})) error
	CreateObjectWithId(bucketName string, id int, obj interface{}) error
	CreateObjectWithSetSequence(bucketName string, id int, obj interface{}) error
	GetAll(bucketName string, obj interface{}, append func(o interface{}) (interface{}, error)) error
	GetAllWithJsoniter(bucketName string, obj interface{}, append func(o interface{}) (interface{}, error)) error
	Itob(v int) []byte
}
