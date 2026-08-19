package dataservices

import (
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/slicesx"

	"github.com/stretchr/testify/require"
)

type testObject struct {
	ID    int
	Value int
}

type mockConnection struct {
	store map[int]testObject

	portainer.Connection
}

func (m mockConnection) UpdateObject(bucket string, key []byte, value any) error {
	obj := value.(*testObject)

	m.store[obj.ID] = *obj

	return nil
}

func (m mockConnection) GetAll(bucketName string, obj any, appendFn func(o any) (any, error)) error {
	for _, v := range m.store {
		if _, err := appendFn(&v); err != nil {
			return err
		}
	}

	return nil
}

func (m mockConnection) UpdateTx(fn func(portainer.Transaction) error) error {
	return fn(m)
}

func (m mockConnection) ViewTx(fn func(portainer.Transaction) error) error {
	return fn(m)
}

func (m mockConnection) ConvertToKey(v int) []byte {
	return []byte(strconv.Itoa(v))
}
func TestReadAll(t *testing.T) {
	t.Parallel()
	service := BaseDataService[testObject, int]{
		Bucket:     "testBucket",
		Connection: mockConnection{store: make(map[int]testObject)},
	}

	data := []testObject{
		{ID: 1, Value: 1},
		{ID: 2, Value: 2},
		{ID: 3, Value: 3},
		{ID: 4, Value: 4},
		{ID: 5, Value: 5},
	}

	for _, item := range data {
		err := service.Update(item.ID, &item)
		require.NoError(t, err)
	}

	// ReadAll without predicates
	result, err := service.ReadAll()
	require.NoError(t, err)

	expected := append([]testObject{}, data...)

	require.ElementsMatch(t, expected, result)

	// ReadAll with predicates
	hasLowID := func(obj testObject) bool { return obj.ID < 3 }
	isEven := func(obj testObject) bool { return obj.Value%2 == 0 }

	result, err = service.ReadAll(hasLowID, isEven)
	require.NoError(t, err)

	expected = slicesx.Filter(expected, hasLowID)
	expected = slicesx.Filter(expected, isEven)

	require.ElementsMatch(t, expected, result)
}
