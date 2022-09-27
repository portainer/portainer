package datastore

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"

	"github.com/google/go-cmp/cmp"
	"github.com/portainer/portainer/api/database/models"
	"github.com/rs/zerolog/log"
)

// testVersion is a helper which tests current store version against wanted version
func testVersion(store *Store, versionWant string, t *testing.T) {
	v, err := store.VersionService.Version()
	if err != nil {
		t.Errorf("Expect store version to be %s but was %s with error: %s", versionWant, v.SchemaVersion, err)
	}
	if v.SchemaVersion != versionWant {
		t.Errorf("Expect store version to be %s but was %s", versionWant, v.SchemaVersion)
	}
}

func TestMigrateData(t *testing.T) {
	snapshotTests := []struct {
		testName           string
		srcPath            string
		wantPath           string
		overrideInstanceId bool
	}{
		{
			testName:           "migrate version 24 to latest",
			srcPath:            "test_data/input_24.json",
			wantPath:           "test_data/output_24_to_latest.json",
			overrideInstanceId: true,
		},
	}
	for _, test := range snapshotTests {
		t.Run(test.testName, func(t *testing.T) {
			err := migrateDBTestHelper(t, test.srcPath, test.wantPath, test.overrideInstanceId)
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
		newStore, store, teardown := MustNewTestStore(t, true, false)
		defer teardown()

		if !newStore {
			t.Error("Expect a new DB")
		}

		testVersion(store, portainer.APIVersion, t)
		store.Close()

		newStore, _ = store.Open()
		if newStore {
			t.Error("Expect store to NOT be new DB")
		}
	})

	tests := []struct {
		version         string
		expectedVersion string
	}{
		{version: "1.24.1", expectedVersion: portainer.APIVersion},
		{version: "2.0.0", expectedVersion: portainer.APIVersion},
	}
	for _, tc := range tests {
		_, store, teardown := MustNewTestStore(t, true, true)
		defer teardown()

		// Setup data
		v := models.Version{SchemaVersion: tc.version}
		store.VersionService.UpdateVersion(&v)

		// Required roles by migrations 22.2
		store.RoleService.Create(&portainer.Role{ID: 1})
		store.RoleService.Create(&portainer.Role{ID: 2})
		store.RoleService.Create(&portainer.Role{ID: 3})
		store.RoleService.Create(&portainer.Role{ID: 4})

		t.Run(fmt.Sprintf("MigrateData for version %s", tc.version), func(t *testing.T) {
			store.MigrateData()
			testVersion(store, tc.expectedVersion, t)
		})

		t.Run(fmt.Sprintf("Restoring DB after migrateData for version %s", tc.version), func(t *testing.T) {
			store.Rollback(true)
			store.Open()
			testVersion(store, tc.version, t)
		})
	}

	t.Run("Error in MigrateData should restore backup before MigrateData", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(t, false, true)
		defer teardown()

		v := models.Version{SchemaVersion: "1.24.1"}
		store.VersionService.UpdateVersion(&v)

		store.MigrateData()

		testVersion(store, v.SchemaVersion, t)
	})

	t.Run("MigrateData should create backup file upon update", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(t, false, true)
		defer teardown()

		v := models.Version{SchemaVersion: "0.0.0"}
		store.VersionService.UpdateVersion(&v)

		store.MigrateData()

		options := store.setupOptions(getBackupRestoreOptions(store.commonBackupDir()))

		if !isFileExist(options.BackupPath) {
			t.Errorf("Backup file should exist; file=%s", options.BackupPath)
		}
	})

	t.Run("MigrateData should fail to create backup if database file is set to updating", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(t, false, true)
		defer teardown()

		store.VersionService.StoreIsUpdating(true)

		store.MigrateData()

		options := store.setupOptions(getBackupRestoreOptions(store.commonBackupDir()))

		if isFileExist(options.BackupPath) {
			t.Errorf("Backup file should not exist for dirty database; file=%s", options.BackupPath)
		}
	})

	t.Run("MigrateData should not create backup on startup if portainer version matches db", func(t *testing.T) {
		_, store, teardown := MustNewTestStore(t, false, true)
		defer teardown()

		store.MigrateData()

		options := store.setupOptions(getBackupRestoreOptions(store.commonBackupDir()))

		if isFileExist(options.BackupPath) {
			t.Errorf("Backup file should not exist for dirty database; file=%s", options.BackupPath)
		}
	})
}

func Test_getBackupRestoreOptions(t *testing.T) {
	_, store, teardown := MustNewTestStore(t, false, true)
	defer teardown()

	options := getBackupRestoreOptions(store.commonBackupDir())

	wantDir := store.commonBackupDir()
	if !strings.HasSuffix(options.BackupDir, wantDir) {
		log.Fatal().Str("got", options.BackupDir).Str("want", wantDir).Msg("incorrect backup dir")
	}

	wantFilename := "portainer.db.bak"
	if options.BackupFileName != wantFilename {
		log.Fatal().Str("got", options.BackupFileName).Str("want", wantFilename).Msg("incorrect backup file")
	}
}

func TestRollback(t *testing.T) {
	t.Run("Rollback should restore upgrade after backup", func(t *testing.T) {
		version := models.Version{SchemaVersion: "2.4.0"}
		_, store, teardown := MustNewTestStore(t, true, false)
		defer teardown()

		err := store.VersionService.UpdateVersion(&version)
		if err != nil {
			t.Errorf("Failed updating version: %v", err)
		}

		_, err = store.backupWithOptions(getBackupRestoreOptions(store.commonBackupDir()))
		if err != nil {
			log.Fatal().Err(err).Msg("")
		}

		// Change the current version
		version2 := models.Version{SchemaVersion: "2.6.0"}
		err = store.VersionService.UpdateVersion(&version2)
		if err != nil {
			log.Fatal().Err(err).Msg("")
		}

		err = store.Rollback(true)
		if err != nil {
			t.Logf("Rollback failed: %s", err)
			t.Fail()
			return
		}

		_, err = store.Open()
		if err != nil {
			t.Logf("Open failed: %s", err)
			t.Fail()
			return
		}

		testVersion(store, version.SchemaVersion, t)
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
func migrateDBTestHelper(t *testing.T, srcPath, wantPath string, overrideInstanceId bool) error {
	srcJSON, err := os.ReadFile(srcPath)
	if err != nil {
		t.Fatalf("failed loading source JSON file %v: %v", srcPath, err)
	}

	// Parse source json to db.
	// When we create a new test store, it sets its version field automatically to latest.
	_, store, _ := MustNewTestStore(t, false, false)

	fmt.Println("store.path=", store.GetConnection().GetDatabaseFilePath())
	store.connection.DeleteObject("version", []byte("VERSION"))

	//	defer teardown()
	err = importJSON(t, bytes.NewReader(srcJSON), store)
	if err != nil {
		return err
	}

	err = store.VersionService.Migrate()
	if err != nil {
		return err
	}

	err = store.Init()
	if err != nil {
		return err
	}

	// Run the actual migrations on our input database.
	err = store.MigrateData()
	if err != nil {
		return err
	}

	if overrideInstanceId {
		// old versions of portainer did not have instance-id.  Because this gets generated
		// we need to override the expected output to match the expected value to pass the test

		v, err := store.VersionService.Version()
		if err != nil {
			return err
		}

		v.InstanceID = "463d5c47-0ea5-4aca-85b1-405ceefee254"
		err = store.VersionService.UpdateVersion(v)
		if err != nil {
			return err
		}
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

	gotJSON, err := con.ExportJSON(databasePath, false)
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

			// New format db
			version, ok := versions["VERSION"]
			if ok {
				err := con.CreateObjectWithStringId(
					k,
					[]byte("VERSION"),
					version,
				)
				if err != nil {
					t.Logf("failed writing VERSION in %s: %v", k, err)
				}
			}

			// old format db

			dbVersion, ok := versions["DB_VERSION"]
			if ok {
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
			}

			instanceID, ok := versions["INSTANCE_ID"]
			if ok {
				err = con.CreateObjectWithStringId(
					k,
					[]byte("INSTANCE_ID"),
					instanceID,
				)
				if err != nil {
					t.Logf("failed writing INSTANCE_ID in %s: %v", k, err)
				}
			}

			edition, ok := versions["EDITION"]
			if ok {
				err = con.CreateObjectWithStringId(
					k,
					[]byte("EDITION"),
					edition,
				)
				if err != nil {
					t.Logf("failed writing EDITION in %s: %v", k, err)
				}
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
