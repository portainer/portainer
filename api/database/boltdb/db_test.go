package boltdb

import (
	"io/ioutil"
	"log"
	"os"
	"path"
	"testing"

	"github.com/sirupsen/logrus"
	"github.com/stretchr/testify/assert"
)

func Test_NeedsEncryptionMigration(t *testing.T) {
	// Test the specific scenarios mentioend in NeedsEncryptionMigration

	// i.e.
	// Cases:  Note, we need to check both portainer.db and portainer.edb
	// to determine if it's a new store.   We only need to differentiate between cases 2,3 and 5

	// 1) portainer.edb + key     => False
	// 2) portainer.edb + no key  => ERROR Fatal!
	// 3) portainer.db  + key     => True  (needs migration)
	// 4) portainer.db  + no key  => False
	// 5) NoDB (new)    + key     => False
	// 6) NoDB (new)    + no key  => False

	is := assert.New(t)

	// Create temp dir for our tests
	dir, err := ioutil.TempDir("", "test_NeedsEncryptionmigration")
	if err != nil {
		log.Fatal(err)
	}
	//defer os.RemoveAll(dir)

	cases := []struct {
		name           string
		dbname         string
		key            bool
		expectFatal    bool
		expectedResult bool
	}{
		{
			name:           "portainer.edb + key",
			dbname:         EncryptedDatabaseFileName,
			key:            true,
			expectFatal:    false,
			expectedResult: false,
		},
		{
			name:           "portainer.edb + no key",
			dbname:         EncryptedDatabaseFileName,
			key:            false,
			expectFatal:    true,
			expectedResult: false,
		},
		{
			name:           "portainer.db + key (migration needed)",
			dbname:         DatabaseFileName,
			key:            true,
			expectFatal:    false,
			expectedResult: true,
		},
		{
			name:           "portainer.db + no key",
			dbname:         DatabaseFileName,
			key:            false,
			expectFatal:    false,
			expectedResult: false,
		},
		{
			name:           "NoDB (new) + key",
			dbname:         "",
			key:            false,
			expectFatal:    false,
			expectedResult: false,
		},
		{
			name:           "NoDB (new) + no key",
			dbname:         "",
			key:            false,
			expectFatal:    false,
			expectedResult: false,
		},
	}

	defer func() { logrus.StandardLogger().ExitFunc = nil }()
	var fatal bool
	logrus.StandardLogger().ExitFunc = func(int) { fatal = true }

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			fatal = false

			connection := DbConnection{Path: dir}

			if c.dbname != "" {
				dbFile := path.Join(connection.Path, c.dbname)
				f, _ := os.Create(dbFile)

				defer f.Close()
				defer os.Remove(dbFile)

				connection.Path = dir
			}

			if c.key {
				connection.EncryptionKey = []byte("secret")
			}

			result := connection.NeedsEncryptionMigration()

			is.Equal(c.expectFatal, fatal, "A Fatal Error was logged that was not expected")
			is.Equal(result, c.expectedResult, "Failed test %s", c.name)
		})
	}
}
