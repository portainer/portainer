package team

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "teams"
)

// Service represents a service for managing endpoint data.
type Service struct {
	db *bolt.DB
}

// NewService creates a new instance of a service.
func NewService(db *bolt.DB) (*Service, error) {
	err := db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(BucketName))
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// Team returns a Team by ID
func (service *Service) Team(ID portainer.TeamID) (*portainer.Team, error) {
	var data []byte
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		value := bucket.Get(internal.Itob(int(ID)))
		if value == nil {
			return portainer.ErrTeamNotFound
		}

		data = make([]byte, len(value))
		copy(data, value)
		return nil
	})
	if err != nil {
		return nil, err
	}

	var team portainer.Team
	err = internal.UnmarshalObject(data, &team)
	if err != nil {
		return nil, err
	}
	return &team, nil
}

// TeamByName returns a team by name.
func (service *Service) TeamByName(name string) (*portainer.Team, error) {
	var team *portainer.Team

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var t portainer.Team
			err := internal.UnmarshalObject(v, &t)
			if err != nil {
				return err
			}
			if t.Name == name {
				team = &t
			}
		}

		if team == nil {
			return portainer.ErrTeamNotFound
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return team, nil
}

// Teams return an array containing all the teams.
func (service *Service) Teams() ([]portainer.Team, error) {
	var teams = make([]portainer.Team, 0)
	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var team portainer.Team
			err := internal.UnmarshalObject(v, &team)
			if err != nil {
				return err
			}
			teams = append(teams, team)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return teams, nil
}

// UpdateTeam saves a Team.
func (service *Service) UpdateTeam(ID portainer.TeamID, team *portainer.Team) error {
	data, err := internal.MarshalObject(team)
	if err != nil {
		return err
	}

	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err = bucket.Put(internal.Itob(int(ID)), data)

		if err != nil {
			return err
		}
		return nil
	})
}

// CreateTeam creates a new Team.
func (service *Service) CreateTeam(team *portainer.Team) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		id, _ := bucket.NextSequence()
		team.ID = portainer.TeamID(id)

		data, err := internal.MarshalObject(team)
		if err != nil {
			return err
		}

		err = bucket.Put(internal.Itob(int(team.ID)), data)
		if err != nil {
			return err
		}
		return nil
	})
}

// DeleteTeam deletes a Team.
func (service *Service) DeleteTeam(ID portainer.TeamID) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
