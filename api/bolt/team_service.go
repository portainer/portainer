package bolt

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

// TeamService represents a service for managing teams.
type TeamService struct {
	store *Store
}

// Team returns a Team by ID
func (service *TeamService) Team(ID portainer.TeamID) (*portainer.Team, error) {
	var data []byte
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(teamBucketName))
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
	err = internal.UnmarshalTeam(data, &team)
	if err != nil {
		return nil, err
	}
	return &team, nil
}

// TeamByName returns a team by name.
func (service *TeamService) TeamByName(name string) (*portainer.Team, error) {
	var team *portainer.Team

	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(teamBucketName))
		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var t portainer.Team
			err := internal.UnmarshalTeam(v, &t)
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
func (service *TeamService) Teams() ([]portainer.Team, error) {
	var teams = make([]portainer.Team, 0)
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(teamBucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var team portainer.Team
			err := internal.UnmarshalTeam(v, &team)
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

// TeamsByUserID return an array containing all the teams where the specified userID is present.
func (service *TeamService) TeamsByUserID(userID portainer.UserID) ([]portainer.Team, error) {
	var teams = make([]portainer.Team, 0)
	err := service.store.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(teamBucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var team portainer.Team
			err := internal.UnmarshalTeam(v, &team)
			if err != nil {
				return err
			}
			for _, v := range team.Users {
				if v == userID {
					teams = append(teams, team)
				}
			}
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return teams, nil
}

// UpdateTeam saves a Team.
func (service *TeamService) UpdateTeam(ID portainer.TeamID, team *portainer.Team) error {
	data, err := internal.MarshalTeam(team)
	if err != nil {
		return err
	}

	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(teamBucketName))
		err = bucket.Put(internal.Itob(int(ID)), data)

		if err != nil {
			return err
		}
		return nil
	})
}

// CreateTeam creates a new Team.
func (service *TeamService) CreateTeam(team *portainer.Team) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(teamBucketName))

		id, _ := bucket.NextSequence()
		team.ID = portainer.TeamID(id)

		data, err := internal.MarshalTeam(team)
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
func (service *TeamService) DeleteTeam(ID portainer.TeamID) error {
	return service.store.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(teamBucketName))
		err := bucket.Delete(internal.Itob(int(ID)))
		if err != nil {
			return err
		}
		return nil
	})
}
