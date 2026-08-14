package boltdb

import (
	"errors"
	"strconv"
	"testing"
	"time"

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
	t.Parallel()
	conn := DbConnection{Path: t.TempDir()}

	err := conn.Open()
	require.NoError(t, err)
	t.Cleanup(func() {
		err := conn.Close()
		require.NoError(t, err)
	})

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

func TestBatchingEnabled(t *testing.T) {
	t.Parallel()

	conn := DbConnection{}
	require.False(t, conn.BatchingEnabled(), "batching must be disabled when MaxBatchSize/MaxBatchDelay are unset")

	conn.MaxBatchSize = 1000
	require.False(t, conn.BatchingEnabled(), "batching must stay disabled without a MaxBatchDelay")

	conn.MaxBatchDelay = 0
	conn.MaxBatchSize = 1
	require.False(t, conn.BatchingEnabled(), "batching must stay disabled with MaxBatchSize <= 1")

	conn.MaxBatchSize = 1000
	conn.MaxBatchDelay = time.Millisecond
	require.True(t, conn.BatchingEnabled(), "batching must be enabled once both MaxBatchSize > 1 and MaxBatchDelay > 0")
}

func TestUpdateTxBatch(t *testing.T) {
	t.Parallel()
	conn := DbConnection{Path: t.TempDir()}

	err := conn.Open()
	require.NoError(t, err)
	t.Cleanup(func() {
		err := conn.Close()
		require.NoError(t, err)
	})

	// Batching disabled: UpdateTxBatch falls back to a plain Update per call
	newObj := testStruct{Key: "key", Value: "value"}

	err = conn.UpdateTxBatch(func(tx portainer.Transaction) error {
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
	require.Equal(t, newObj, obj)

	// Batching enabled: UpdateTxBatch coalesces callers via bbolt's Batch()
	conn.MaxBatchSize = 1000
	conn.MaxBatchDelay = 10 * time.Millisecond

	updatedObj := testStruct{Key: "updated-key", Value: "updated-value"}

	err = conn.UpdateTxBatch(func(tx portainer.Transaction) error {
		return tx.UpdateObject(testBucketName, conn.ConvertToKey(testId), &updatedObj)
	})
	require.NoError(t, err)

	err = conn.ViewTx(func(tx portainer.Transaction) error {
		return tx.GetObject(testBucketName, conn.ConvertToKey(testId), &obj)
	})
	require.NoError(t, err)
	require.Equal(t, updatedObj, obj)

	// Error propagation through the batched path
	err = conn.UpdateTxBatch(func(tx portainer.Transaction) error {
		return errors.New("this is an error")
	})
	require.Error(t, err)
}

func BenchmarkGetAll(b *testing.B) {
	const endpointBucket = "endpoints"
	const n = 10000

	conn := DbConnection{Path: b.TempDir()}

	err := conn.Open()
	require.NoError(b, err)
	b.Cleanup(func() {
		err := conn.Close()
		require.NoError(b, err)
	})

	err = conn.UpdateTx(func(tx portainer.Transaction) error {
		if err := tx.SetServiceName(endpointBucket); err != nil {
			return err
		}

		for i := 1; i <= n; i++ {
			ep := portainer.Endpoint{
				ID:              portainer.EndpointID(i),
				Name:            "env-" + strconv.Itoa(i),
				Type:            portainer.DockerEnvironment,
				URL:             "tcp://192.168.1." + strconv.Itoa(i%254+1) + ":2375",
				PublicURL:       "https://env-" + strconv.Itoa(i) + ".example.com",
				GroupID:         portainer.EndpointGroupID(i%10 + 1),
				TagIDs:          []portainer.TagID{portainer.TagID(i%5 + 1), portainer.TagID(i%3 + 1)},
				LastCheckInDate: int64(i) * 1000,
				EdgeID:          "edge-" + strconv.Itoa(i),
			}

			if err := tx.CreateObjectWithId(endpointBucket, i, &ep); err != nil {
				return err
			}
		}

		return nil
	})
	require.NoError(b, err)

	b.ResetTimer()
	b.ReportAllocs()

	for b.Loop() {
		var collection []portainer.Endpoint

		if err := conn.ViewTx(func(tx portainer.Transaction) error {
			return tx.GetAll(endpointBucket, new(portainer.Endpoint), dataservices.AppendFn(&collection))
		}); err != nil {
			b.Fatal(err)
		}
	}
}
