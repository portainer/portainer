package datastore

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/google/go-cmp/cmp"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
)

// testVersion is a helper which tests current store version against wanted version
func testVersion(store *Store, versionWant int, t *testing.T) {
	v, err := store.VersionService.DBVersion()
	if err != nil {
		t.Errorf("Expect store version to be %d but was %d with error: %s", versionWant, v, err)
	}
	if v != versionWant {
		t.Errorf("Expect store version to be %d but was %d", versionWant, v)
	}
}

func TestMigrateData(t *testing.T) {
	snapshotTests := []struct {
		testName string
		srcPath  string
		wantPath string
	}{
		{
			testName: "migrate version 24 to 35",
			srcPath:  "test_data/input_24.json",
			wantPath: "test_data/output_35.json",
		},
	}
	for _, test := range snapshotTests {
		t.Run(test.testName, func(t *testing.T) {
			err := migrateDBTestHelper(t, test.srcPath, test.wantPath)
			if err != nil {
				t.Errorf(
					"Failed migrating mock database %v: %v",
					test.srcPath,
					err,
				)
			}
		})
	}

	t.Run("MigrateData for New Store & Re-Open Check", func(t *testing.T) {
		newStore, store, teardown := MustNewTestStore(false, true)
		defer teardown()

		if !newStore {
			t.Error("Expect a new DB")
		}

		// not called for new stores
		//store.MigrateData()

		testVersion(store, portainer.DBVersion, t)
		store.Close()

		newStore, _ = store.Open()
		if newStore {
			t.Error("Expect store to NOT be new DB")
		}
	})

	tests := []struct {
		version         int
		expectedVersion int
	}{
		{version: 17, expectedVersion: portainer.DBVersion},
		{version: 21, expectedVersion: portainer.DBVersion},
	}
	for _, tc := range tests {
		_, store, teardown := MustNewTestStore(true, true)
		defer teardown()

		// Setup data
		store.VersionService.StoreDBVersion(tc.version)

		// Required roles by migrations 22.2
		store.RoleService.Create(&portainer.Role{ID: 1})
		store.RoleService.Create(&portainer.Role{ID: 2})
		store.RoleService.Create(&portainer.Role{ID: 3})
		store.RoleService.Create(&portainer.Role{ID: 4})

		t.Run(fmt.Sprintf("MigrateData for version %d", tc.version), func(t *testing.T) {
			store.MigrateData()
			testVersion(store, tc.expectedVersion, t)
		})

		t.Run(fmt.Sprintf("Restoring DB after migrateData for version %d", tc.version), func(t *testing.T) {
			store.Rollback(true)
			store.Open()
			testVersion(store, tc.version, t)
		})
	}

	t.Run("Error in MigrateData should restore backup before MigrateData", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(false, true)
		defer teardown()

		version := 17
		store.VersionService.StoreDBVersion(version)

		store.MigrateData()

		testVersion(store, version, t)
	})

	t.Run("MigrateData should create backup file upon update", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(false, true)
		defer teardown()
		store.VersionService.StoreDBVersion(0)

		store.MigrateData()

		options := store.setupOptions(getBackupRestoreOptions(store.commonBackupDir()))

		if !isFileExist(options.BackupPath) {
			t.Errorf("Backup file should exist; file=%s", options.BackupPath)
		}
	})

	t.Run("MigrateData should fail to create backup if database file is set to updating", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(false, true)
		defer teardown()

		store.VersionService.StoreIsUpdating(true)

		store.MigrateData()

		options := store.setupOptions(getBackupRestoreOptions(store.commonBackupDir()))

		if isFileExist(options.BackupPath) {
			t.Errorf("Backup file should not exist for dirty database; file=%s", options.BackupPath)
		}
	})

	t.Run("MigrateData should not create backup on startup if portainer version matches db", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(false, true)
		defer teardown()

		store.MigrateData()

		options := store.setupOptions(getBackupRestoreOptions(store.commonBackupDir()))

		if isFileExist(options.BackupPath) {
			t.Errorf("Backup file should not exist for dirty database; file=%s", options.BackupPath)
		}
	})

}

func Test_getBackupRestoreOptions(t *testing.T) {
	_, store, teardown := MustNewTestStore(false, true)
	defer teardown()

	options := getBackupRestoreOptions(store.commonBackupDir())

	wantDir := store.commonBackupDir()
	if !strings.HasSuffix(options.BackupDir, wantDir) {
		log.Fatalf("incorrect backup dir; got=%s, want=%s", options.BackupDir, wantDir)
	}

	wantFilename := "portainer.db.bak"
	if options.BackupFileName != wantFilename {
		log.Fatalf("incorrect backup file; got=%s, want=%s", options.BackupFileName, wantFilename)
	}
}

func TestRollback(t *testing.T) {
	t.Run("Rollback should restore upgrade after backup", func(t *testing.T) {
		version := 21
		_, store, teardown := MustNewTestStore(false, true)
		defer teardown()
		store.VersionService.StoreDBVersion(version)

		_, err := store.backupWithOptions(getBackupRestoreOptions(store.commonBackupDir()))
		if err != nil {
			log.Fatal(err)
		}

		// Change the current edition
		err = store.VersionService.StoreDBVersion(version + 10)
		if err != nil {
			log.Fatal(err)
		}

		err = store.Rollback(true)
		if err != nil {
			t.Logf("Rollback failed: %s", err)
			t.Fail()
			return
		}

		store.Open()
		testVersion(store, version, t)
	})
}

// isFileExist is helper function to check for file existence
func isFileExist(path string) bool {
	matches, err := filepath.Glob(path)
	if err != nil {
		return false
	}
	return len(matches) > 0
}

// migrateDBTestHelper loads a json representation of a bolt database from srcPath,
// parses it into a database, runs a migration on that database, and then
// compares it with an expected output database.
func migrateDBTestHelper(t *testing.T, srcPath, wantPath string) error {
	srcJSON, err := os.ReadFile(srcPath)
	if err != nil {
		t.Fatalf("failed loading source JSON file %v: %v", srcPath, err)
	}

	// Parse source json to db.
	_, store, teardown := MustNewTestStore(true, false)
	defer teardown()
	err = importJSON(t, bytes.NewReader(srcJSON), store)
	if err != nil {
		return err
	}

	// Run the actual migrations on our input database.
	err = store.MigrateData()
	if err != nil {
		return err
	}

	// Assert that our database connection is using bolt so we can call
	// exportJson rather than ExportRaw. The exportJson function allows us to
	// strip out the metadata which we don't want for our tests.
	// TODO: update connection interface in CE to allow us to use ExportRaw and pass meta false
	err = store.connection.Close()
	if err != nil {
		t.Fatalf("err closing bolt connection: %v", err)
	}
	con, ok := store.connection.(*boltdb.DbConnection)
	if !ok {
		t.Fatalf("backing database is not using boltdb, but the migrations test requires it")
	}

	// Convert database back to json.
	databasePath := con.GetDatabaseFilePath()
	if _, err := os.Stat(databasePath); err != nil {
		return fmt.Errorf("stat on %s failed: %s", databasePath, err)
	}

	gotJSON, err := con.ExportJson(databasePath, false)
	if err != nil {
		t.Logf(
			"failed re-exporting database %s to JSON: %v",
			databasePath,
			err,
		)
	}

	wantJSON, err := os.ReadFile(wantPath)
	if err != nil {
		t.Fatalf("failed loading want JSON file %v: %v", wantPath, err)
	}

	// Compare the result we got with the one we wanted.
	if diff := cmp.Diff(wantJSON, gotJSON); diff != "" {
		gotPath := filepath.Join(os.TempDir(), "portainer-migrator-test-fail.json")
		os.WriteFile(
			gotPath,
			gotJSON,
			0600,
		)
		t.Errorf(
			"migrate data from %s to %s failed\nwrote migrated input to %s\nmismatch (-want +got):\n%s",
			srcPath,
			wantPath,
			gotPath,
			diff,
		)
	}
	return nil
}

// importJSON reads input JSON and commits it to a portainer datastore.Store.
// Errors are logged with the testing package.
func importJSON(t *testing.T, r io.Reader, store *Store) error {
	objects := make(map[string]interface{})

	// Parse json into map of objects.
	d := json.NewDecoder(r)
	d.UseNumber()
	err := d.Decode(&objects)
	if err != nil {
		return err
	}

	// Get database connection from store.
	con := store.connection

	for k, v := range objects {
		switch k {
		case "version":
			versions, ok := v.(map[string]interface{})
			if !ok {
				t.Logf("failed casting %s to map[string]interface{}", k)
			}

			dbVersion, ok := versions["DB_VERSION"]
			if !ok {
				t.Logf("failed getting DB_VERSION from %s", k)
			}

			numDBVersion, ok := dbVersion.(json.Number)
			if !ok {
				t.Logf("failed parsing DB_VERSION as json number from %s", k)
			}

			intDBVersion, err := numDBVersion.Int64()
			if err != nil {
				t.Logf("failed casting %v to int: %v", numDBVersion, intDBVersion)
			}

			err = con.CreateObjectWithStringId(
				k,
				[]byte("DB_VERSION"),
				int(intDBVersion),
			)
			if err != nil {
				t.Logf("failed writing DB_VERSION in %s: %v", k, err)
			}

			instanceID, ok := versions["INSTANCE_ID"]
			if !ok {
				t.Logf("failed getting INSTANCE_ID from %s", k)
			}

			err = con.CreateObjectWithStringId(
				k,
				[]byte("INSTANCE_ID"),
				instanceID,
			)
			if err != nil {
				t.Logf("failed writing INSTANCE_ID in %s: %v", k, err)
			}

		case "dockerhub":
			obj, ok := v.([]interface{})
			if !ok {
				t.Logf("failed to cast %s to []interface{}", k)
			}
			err := con.CreateObjectWithStringId(
				k,
				[]byte("DOCKERHUB"),
				obj[0],
			)
			if err != nil {
				t.Logf("failed writing DOCKERHUB in %s: %v", k, err)
			}

		case "ssl":
			obj, ok := v.(map[string]interface{})
			if !ok {
				t.Logf("failed to case %s to map[string]interface{}", k)
			}
			err := con.CreateObjectWithStringId(
				k,
				[]byte("SSL"),
				obj,
			)
			if err != nil {
				t.Logf("failed writing SSL in %s: %v", k, err)
			}

		case "settings":
			obj, ok := v.(map[string]interface{})
			if !ok {
				t.Logf("failed to case %s to map[string]interface{}", k)
			}
			err := con.CreateObjectWithStringId(
				k,
				[]byte("SETTINGS"),
				obj,
			)
			if err != nil {
				t.Logf("failed writing SETTINGS in %s: %v", k, err)
			}

		case "tunnel_server":
			obj, ok := v.(map[string]interface{})
			if !ok {
				t.Logf("failed to case %s to map[string]interface{}", k)
			}
			err := con.CreateObjectWithStringId(
				k,
				[]byte("INFO"),
				obj,
			)
			if err != nil {
				t.Logf("failed writing INFO in %s: %v", k, err)
			}
		case "templates":
			continue

		default:
			objlist, ok := v.([]interface{})
			if !ok {
				t.Logf("failed to cast %s to []interface{}", k)
			}

			for _, obj := range objlist {
				value, ok := obj.(map[string]interface{})
				if !ok {
					t.Logf("failed to cast %v to map[string]interface{}", obj)
				} else {
					var ok bool
					var id interface{}
					switch k {
					case "endpoint_relations":
						// TODO: need to make into an int, then do that weird
						// stringification
						id, ok = value["EndpointID"]
					default:
						id, ok = value["Id"]
					}
					if !ok {
						// endpoint_relations: EndpointID
						t.Logf("missing Id field: %s", k)
						id = "error"
					}
					n, ok := id.(json.Number)
					if !ok {
						t.Logf("failed to cast %v to json.Number in %s", id, k)
					} else {
						key, err := n.Int64()
						if err != nil {
							t.Logf("failed to cast %v to int in %s", n, k)
						} else {
							err := con.CreateObjectWithId(
								k,
								int(key),
								value,
							)
							if err != nil {
								t.Logf("failed writing %v in %s: %v", key, k, err)
							}
						}
					}
				}
			}
		}
	}

	return nil
}
