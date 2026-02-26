package boltdb

import (
	"errors"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/stretchr/testify/require"
)

const testBucketName = "test-bucket"
const testId = 1234

type testStruct struct {
	Key   string
	Value string
}

func TestTxs(t *testing.T) {
	conn := DbConnection{Path: t.TempDir()}

	err := conn.Open()
	require.NoError(t, err)
	defer func() {
		err := conn.Close()
		require.NoError(t, err)
	}()

	// Error propagation
	err = conn.UpdateTx(func(tx portainer.Transaction) error {
		return errors.New("this is an error")
	})
	require.Error(t, err)

	// Create an object
	newObj := testStruct{Key: "key", Value: "value"}

	err = conn.UpdateTx(func(tx portainer.Transaction) error {
		if err := tx.SetServiceName(testBucketName); err != nil {
			return err
		}

		return tx.CreateObjectWithId(testBucketName, testId, newObj)
	})
	require.NoError(t, err)

	obj := testStruct{}
	err = conn.ViewTx(func(tx portainer.Transaction) error {
		return tx.GetObject(testBucketName, conn.ConvertToKey(testId), &obj)
	})
	require.NoError(t, err)

	if obj.Key != newObj.Key || obj.Value != newObj.Value {
		t.Fatalf("expected %s:%s, got %s:%s instead", newObj.Key, newObj.Value, obj.Key, obj.Value)
	}

	// Update an object
	updatedObj := testStruct{Key: "updated-key", Value: "updated-value"}

	err = conn.UpdateTx(func(tx portainer.Transaction) error {
		return tx.UpdateObject(testBucketName, conn.ConvertToKey(testId), &updatedObj)
	})
	require.NoError(t, err)

	err = conn.ViewTx(func(tx portainer.Transaction) error {
		return tx.GetObject(testBucketName, conn.ConvertToKey(testId), &obj)
	})
	require.NoError(t, err)

	if obj.Key != updatedObj.Key || obj.Value != updatedObj.Value {
		t.Fatalf("expected %s:%s, got %s:%s instead", updatedObj.Key, updatedObj.Value, obj.Key, obj.Value)
	}

	// Delete an object
	err = conn.UpdateTx(func(tx portainer.Transaction) error {
		return tx.DeleteObject(testBucketName, conn.ConvertToKey(testId))
	})
	require.NoError(t, err)

	err = conn.ViewTx(func(tx portainer.Transaction) error {
		return tx.GetObject(testBucketName, conn.ConvertToKey(testId), &obj)
	})
	require.True(t, dataservices.IsErrObjectNotFound(err))

	// Get next identifier
	err = conn.UpdateTx(func(tx portainer.Transaction) error {
		id1 := tx.GetNextIdentifier(testBucketName)
		id2 := tx.GetNextIdentifier(testBucketName)

		if id1+1 != id2 {
			return errors.New("unexpected identifier sequence")
		}

		return nil
	})
	require.NoError(t, err)

	// Try to write in a read transaction
	err = conn.ViewTx(func(tx portainer.Transaction) error {
		return tx.CreateObjectWithId(testBucketName, testId, newObj)
	})
	require.Error(t, err)
}
