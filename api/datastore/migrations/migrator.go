package migrations

import (
	"fmt"
	"sort"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/datastore/migrations/types"
	"github.com/sirupsen/logrus"
)

type apiDBVersion struct {
	api string
	db  int
}
type apiVersionsMap []apiDBVersion

type migrations []*types.Migration

type Migrator struct {
	store      datastore.Store
	Versions   []int
	Migrations map[int]migrations
}

var migrator *Migrator = &Migrator{
	Versions:   []int{},
	Migrations: map[int]migrations{},
}

var versionsMap apiVersionsMap = apiVersionsMap{
	{"2.12.0", 36},
	{"2.9.3", 35},
	{"2.10.0", 34},
	{"2.9.2", 33},
	{"2.9.1", 33},
	{"2.9.0", 32},
	{"2.7.0", 31},
	{"2.6.0", 30},
	{"2.4.0", 29},
	{"2.4.0", 28},
	{"2.2.0", 27},
	{"2.1.0", 26},
}

func NewMigrator(m datastore.Store) *Migrator {
	migrator.store = m
	return migrator
}

func (m *Migrator) AddMigration(mg types.Migration) {
	// Add the migration to the hash with version as key
	if m.Migrations[mg.Version] == nil {
		m.Migrations[mg.Version] = make(migrations, 0)
	}
	m.Migrations[mg.Version] = append(m.Migrations[mg.Version], &mg)

	if !contains(m.Versions, mg.Version) {
		// Insert version into versions array using insertion sort
		index := 0
		for index < len(m.Versions) {
			if m.Versions[index] > mg.Version {
				break
			}
			index++
		}

		m.Versions = append(m.Versions, mg.Version)
		copy(m.Versions[index+1:], m.Versions[index:])
		m.Versions[index] = mg.Version
	}
}

func (m *Migrator) Migrate(currentVersion int) error {
    migrationsToRun := &Migrator{
        Versions:   []int{},
        Migrations: map[int]migrations{},
    }
	for _, v := range m.Versions {
		mg := m.Migrations[v]
        // if migration version is below current version
        if v < currentVersion {
            continue
        }
        migrationsToRun.Versions = append(migrationsToRun.Versions, v)
        migrationsToRun.Migrations[v] = mg
	}

    // TODO: Sort by Timestamp
    for _, v := range migrationsToRun.Versions {
        mg := m.Migrations[v]
        for _, m := range mg {
            logger := logrus.WithFields(logrus.Fields{"version": m.Version, "migration": m.Name})
            logger.Info("starting migration")
            err := m.Up()
            if err != nil {
                return errors.Wrap(err, fmt.Sprintf("while running migration for version %d, name `%s`", m.Version, m.Name))
            }
            m.Completed = true
            logger.Info("migration completed successfully")
        }
    }
	return nil
}

// TODO: move to utils
func contains(s []int, searchterm int) bool {
	i := sort.SearchInts(s, searchterm)
	return i < len(s) && s[i] == searchterm
}
