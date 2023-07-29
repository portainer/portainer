package user

import (
	"errors"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dserrors "github.com/portainer/portainer/api/dataservices/errors"
)

type ServiceTx struct {
	dataservices.BaseDataServiceTx[portainer.User, portainer.UserID]
}

// UserByUsername returns a user by username.
func (service ServiceTx) UserByUsername(username string) (*portainer.User, error) {
	var u portainer.User

	err := service.Tx.GetAll(
		BucketName,
		&portainer.User{},
		dataservices.FirstFn(&u, func(e portainer.User) bool {
			return strings.EqualFold(e.Username, username)
		}),
	)

	if errors.Is(err, dataservices.ErrStop) {
		return &u, nil
	}

	if err == nil {
		return nil, dserrors.ErrObjectNotFound
	}

	return nil, err
}

// UsersByRole return an array containing all the users with the specified role.
func (service ServiceTx) UsersByRole(role portainer.UserRole) ([]portainer.User, error) {
	var users = make([]portainer.User, 0)

	return users, service.Tx.GetAll(
		BucketName,
		&portainer.User{},
		dataservices.FilterFn(&users, func(e portainer.User) bool {
			return e.Role == role
		}),
	)
}

// CreateUser creates a new user.
func (service ServiceTx) Create(user *portainer.User) error {
	return service.Tx.CreateObject(
		BucketName,
		func(id uint64) (int, interface{}) {
			user.ID = portainer.UserID(id)
			user.Username = strings.ToLower(user.Username)

			return int(user.ID), user
		},
	)
}
