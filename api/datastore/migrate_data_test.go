package datastore

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"testing"

	"github.com/Masterminds/semver"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/database/models"
	"github.com/portainer/portainer/api/datastore/migrator"

	"github.com/google/go-cmp/cmp"
	"github.com/rs/zerolog/log"
)

func TestMigrateData(t *testing.T) {
	tests := []struct {
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
	for _, test := range tests {
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
		newStore, store := MustNewTestStore(t, true, false)
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

	t.Run("MigrateData should create backup file upon update", func(t *testing.T) {
		_, store := MustNewTestStore(t, true, false)
		store.VersionService.UpdateVersion(&models.Version{SchemaVersion: "1.0", Edition: int(portainer.PortainerCE)})
		store.MigrateData()

		backupfilename := store.backupFilename()
		if exists, _ := store.fileService.FileExists(backupfilename); !exists {
			t.Errorf("Expect backup file to be created %s", backupfilename)
		}
	})

	t.Run("MigrateData should recover and restore backup during migration critical failure", func(t *testing.T) {
		os.Setenv("PORTAINER_TEST_MIGRATE_FAIL", "FAIL")

		version := "2.15"
		_, store := MustNewTestStore(t, true, false)
		store.VersionService.UpdateVersion(&models.Version{SchemaVersion: version, Edition: int(portainer.PortainerCE)})
		store.MigrateData()

		store.Open()
		testVersion(store, version, t)
	})

	t.Run("MigrateData should fail to create backup if database file is set to updating", func(t *testing.T) {
		_, store := MustNewTestStore(t, true, false)
		store.VersionService.StoreIsUpdating(true)
		store.MigrateData()

		// If you get an error, it usually means that the backup folder doesn't exist (no backups). Expected!
		// If the backup file is not blank, then it means a backup was created.  We don't want that because we
		// only create a backup when the version changes.
		backupfilename := store.backupFilename()
		if exists, _ := store.fileService.FileExists(backupfilename); exists {
			t.Errorf("Backup file should not exist for dirty database")
		}
	})

	t.Run("MigrateData should not create backup on startup if portainer version matches db", func(t *testing.T) {
		_, store := MustNewTestStore(t, true, false)

		// Set migrator the count to match our migrations array (simulate no changes).
		// Should not create a backup
		v, err := store.VersionService.Version()
		if err != nil {
			t.Errorf("Unable to read version from db: %s", err)
			t.FailNow()
		}

		migratorParams := store.newMigratorParameters(v, store.flags)
		m := migrator.NewMigrator(migratorParams)
		latestMigrations := m.LatestMigrations()

		if latestMigrations.Version.Equal(semver.MustParse(portainer.APIVersion)) {
			v.MigratorCount = len(latestMigrations.MigrationFuncs)
			store.VersionService.UpdateVersion(v)
		}

		store.MigrateData()

		// If you get an error, it usually means that the backup folder doesn't exist (no backups). Expected!
		// If the backup file is not blank, then it means a backup was created.  We don't want that because we
		// only create a backup when the version changes.
		backupfilename := store.backupFilename()
		if exists, _ := store.fileService.FileExists(backupfilename); exists {
			t.Errorf("Backup file should not exist for dirty database")
		}
	})

	t.Run("MigrateData should create backup on startup if portainer version matches db and migrationFuncs counts differ", func(t *testing.T) {
		_, store := MustNewTestStore(t, true, false)

		// Set migrator count very large to simulate changes
		// Should not create a backup
		v, err := store.VersionService.Version()
		if err != nil {
			t.Errorf("Unable to read version from db: %s", err)
			t.FailNow()
		}

		v.MigratorCount = 1000
		store.VersionService.UpdateVersion(v)
		store.MigrateData()

		// If you get an error, it usually means that the backup folder doesn't exist (no backups). Expected!
		// If the backup file is not blank, then it means a backup was created.  We don't want that because we
		// only create a backup when the version changes.
		backupfilename := store.backupFilename()
		if exists, _ := store.fileService.FileExists(backupfilename); !exists {
			t.Errorf("DB backup should exist and there should be no error")
		}
	})
}

func TestRollback(t *testing.T) {
	t.Run("Rollback should restore upgrade after backup", func(t *testing.T) {
		version := "2.11"

		v := models.Version{
			SchemaVersion: version,
		}

		_, store := MustNewTestStore(t, false, false)
		store.VersionService.UpdateVersion(&v)

		_, err := store.Backup("")
		if err != nil {
			log.Fatal().Err(err).Msg("")
		}

		v.SchemaVersion = "2.14"
		// Change the current edition
		err = store.VersionService.UpdateVersion(&v)
		if err != nil {
			log.Fatal().Err(err).Msg("")
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

	t.Run("Rollback should restore upgrade after backup", func(t *testing.T) {
		version := "2.15"

		v := models.Version{
			SchemaVersion: version,
			Edition:       int(portainer.PortainerCE),
		}

		_, store := MustNewTestStore(t, true, false)
		store.VersionService.UpdateVersion(&v)

		_, err := store.Backup("")
		if err != nil {
			log.Fatal().Err(err).Msg("")
		}

		v.SchemaVersion = "2.14"
		// Change the current edition
		err = store.VersionService.UpdateVersion(&v)
		if err != nil {
			log.Fatal().Err(err).Msg("")
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
	_, store := MustNewTestStore(t, true, false)

	fmt.Println("store.path=", store.GetConnection().GetDatabaseFilePath())
	store.connection.DeleteObject("version", []byte("VERSION"))

	//	defer teardown()
	err = importJSON(t, bytes.NewReader(srcJSON), store)
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
		return fmt.Errorf("stat on %s failed: %w", databasePath, err)
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
			0o600,
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
	objects := make(map[string]any)

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
			versions, ok := v.(map[string]any)
			if !ok {
				t.Logf("failed casting %s to map[string]any", k)
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
			obj, ok := v.([]any)
			if !ok {
				t.Logf("failed to cast %s to []any", k)
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
			obj, ok := v.(map[string]any)
			if !ok {
				t.Logf("failed to case %s to map[string]any", k)
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
			obj, ok := v.(map[string]any)
			if !ok {
				t.Logf("failed to case %s to map[string]any", k)
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
			obj, ok := v.(map[string]any)
			if !ok {
				t.Logf("failed to case %s to map[string]any", k)
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
			objlist, ok := v.([]any)
			if !ok {
				t.Logf("failed to cast %s to []any", k)
			}

			for _, obj := range objlist {
				value, ok := obj.(map[string]any)
				if !ok {
					t.Logf("failed to cast %v to map[string]any", obj)
				} else {
					var ok bool
					var id any
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
