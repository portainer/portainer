package boltdb

import (
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.etcd.io/bbolt"
)

func Test_NeedsEncryptionMigration(t *testing.T) {
	// Test the specific scenarios mentioned in NeedsEncryptionMigration

	// i.e.
	// Cases:  Note, we need to check both portainer.db and portainer.edb
	// to determine if it's a new store.   We only need to differentiate between cases 2,3 and 5

	// 1) portainer.edb + key     => False
	// 2) portainer.edb + no key  => ERROR Fatal!
	// 3) portainer.db  + key     => True  (needs migration)
	// 4) portainer.db  + no key  => False
	// 5) NoDB (new)    + key     => False
	// 6) NoDB (new)    + no key  => False
	// 7) portainer.db & portainer.edb (key not important) => ERROR Fatal!

	is := assert.New(t)
	dir := t.TempDir()

	cases := []struct {
		name         string
		dbname       string
		key          bool
		expectError  error
		expectResult bool
	}{
		{
			name:         "portainer.edb + key",
			dbname:       EncryptedDatabaseFileName,
			key:          true,
			expectError:  nil,
			expectResult: false,
		},
		{
			name:         "portainer.db + key (migration needed)",
			dbname:       DatabaseFileName,
			key:          true,
			expectError:  nil,
			expectResult: true,
		},
		{
			name:         "portainer.db + no key",
			dbname:       DatabaseFileName,
			key:          false,
			expectError:  nil,
			expectResult: false,
		},
		{
			name:         "NoDB (new) + key",
			dbname:       "",
			key:          false,
			expectError:  nil,
			expectResult: false,
		},
		{
			name:         "NoDB (new) + no key",
			dbname:       "",
			key:          false,
			expectError:  nil,
			expectResult: false,
		},

		// error tests
		{
			name:         "portainer.edb + no key",
			dbname:       EncryptedDatabaseFileName,
			key:          false,
			expectError:  ErrHaveEncryptedWithNoKey,
			expectResult: false,
		},
		{
			name:         "portainer.db & portainer.edb",
			dbname:       "both",
			key:          true,
			expectError:  ErrHaveEncryptedAndUnencrypted,
			expectResult: false,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			connection := DbConnection{Path: dir}

			if tc.dbname == "both" {
				// Special case.  If portainer.db and portainer.edb exist.
				dbFile1 := path.Join(connection.Path, DatabaseFileName)
				f, _ := os.Create(dbFile1)
				f.Close()
				defer os.Remove(dbFile1)

				dbFile2 := path.Join(connection.Path, EncryptedDatabaseFileName)
				f, _ = os.Create(dbFile2)
				f.Close()
				defer os.Remove(dbFile2)
			} else if tc.dbname != "" {
				dbFile := path.Join(connection.Path, tc.dbname)
				f, _ := os.Create(dbFile)
				f.Close()
				defer os.Remove(dbFile)
			}

			if tc.key {
				connection.EncryptionKey = []byte("secret")
			}

			result, err := connection.NeedsEncryptionMigration()

			is.Equal(tc.expectError, err, "Fatal Error failure. Test: %s", tc.name)
			is.Equal(result, tc.expectResult, "Failed test: %s", tc.name)
		})
	}
}

func TestDBCompaction(t *testing.T) {
	db := &DbConnection{
		Path:    t.TempDir(),
		Compact: true,
	}

	err := db.Open()
	require.NoError(t, err)

	err = db.Update(func(tx *bbolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("testbucket"))
		if err != nil {
			return err
		}

		b.Put([]byte("key"), []byte("value"))

		return nil
	})
	require.NoError(t, err)

	err = db.Close()
	require.NoError(t, err)

	// Reopen the DB to trigger compaction
	err = db.Open()
	require.NoError(t, err)

	// Check that the data is still there
	err = db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte("testbucket"))
		if b == nil {
			return nil
		}

		val := b.Get([]byte("key"))
		require.Equal(t, []byte("value"), val)

		return nil
	})
	require.NoError(t, err)

	err = db.Close()
	require.NoError(t, err)

	// Failures

	err = os.Mkdir(db.GetDatabaseFilePath()+compactedSuffix, 0o755)
	require.NoError(t, err)

	err = db.Open()
	require.NoError(t, err)
}
