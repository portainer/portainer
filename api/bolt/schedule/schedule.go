package schedule

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt/internal"

	"github.com/boltdb/bolt"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName = "schedules"
)

// Service represents a service for managing schedule data.
type Service struct {
	db *bolt.DB
}

// NewService creates a new instance of a service.
func NewService(db *bolt.DB) (*Service, error) {
	err := internal.CreateBucket(db, BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		db: db,
	}, nil
}

// Schedule returns a schedule by ID.
func (service *Service) Schedule(ID portainer.ScheduleID) (*portainer.Schedule, error) {
	var schedule portainer.Schedule
	identifier := internal.Itob(int(ID))

	err := internal.GetObject(service.db, BucketName, identifier, &schedule)
	if err != nil {
		return nil, err
	}

	return &schedule, nil
}

// UpdateSchedule updates a schedule.
func (service *Service) UpdateSchedule(ID portainer.ScheduleID, schedule *portainer.Schedule) error {
	identifier := internal.Itob(int(ID))
	return internal.UpdateObject(service.db, BucketName, identifier, schedule)
}

// DeleteSchedule deletes a schedule.
func (service *Service) DeleteSchedule(ID portainer.ScheduleID) error {
	identifier := internal.Itob(int(ID))
	return internal.DeleteObject(service.db, BucketName, identifier)
}

// Schedules return a array containing all the schedules.
func (service *Service) Schedules() ([]portainer.Schedule, error) {
	var schedules = make([]portainer.Schedule, 0)

	err := service.db.View(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			var schedule portainer.Schedule
			err := internal.UnmarshalObject(v, &schedule)
			if err != nil {
				return err
			}
			schedules = append(schedules, schedule)
		}

		return nil
	})

	return schedules, err
}

// CreateSchedule assign an ID to a new schedule and saves it.
func (service *Service) CreateSchedule(schedule *portainer.Schedule) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		// We manually manage sequences for schedules
		err := bucket.SetSequence(uint64(schedule.ID))
		if err != nil {
			return err
		}

		data, err := internal.MarshalObject(schedule)
		if err != nil {
			return err
		}

		return bucket.Put(internal.Itob(int(schedule.ID)), data)
	})
}

// GetNextIdentifier returns the next identifier for a schedule.
func (service *Service) GetNextIdentifier() int {
	return internal.GetNextIdentifier(service.db, BucketName)
}

// Synchronize creates, updates and deletes schedules inside a single transaction.
func (service *Service) Synchronize(toCreate, toUpdate, toDelete []*portainer.Schedule) error {
	return service.db.Update(func(tx *bolt.Tx) error {
		bucket := tx.Bucket([]byte(BucketName))

		for _, schedule := range toCreate {
			id, _ := bucket.NextSequence()
			schedule.ID = portainer.ScheduleID(id)

			data, err := internal.MarshalObject(schedule)
			if err != nil {
				return err
			}

			err = bucket.Put(internal.Itob(int(schedule.ID)), data)
			if err != nil {
				return err
			}
		}

		for _, schedule := range toUpdate {
			data, err := internal.MarshalObject(schedule)
			if err != nil {
				return err
			}

			err = bucket.Put(internal.Itob(int(schedule.ID)), data)
			if err != nil {
				return err
			}
		}

		for _, schedule := range toDelete {
			err := bucket.Delete(internal.Itob(int(schedule.ID)))
			if err != nil {
				return err
			}
		}

		return nil
	})
}
