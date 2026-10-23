package users

import (
	"errors"
	"slices"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

var errLastAdmin = errors.New("At least one administrator account is required")

func ensureAnotherAdminExists(tx dataservices.DataStoreTx, userID portainer.UserID) error {
	admins, err := tx.User().UsersByRole(portainer.AdministratorRole)
	if err != nil {
		return err
	}

	if slices.ContainsFunc(admins, func(admin portainer.User) bool { return admin.ID != userID }) {
		return nil
	}

	return errLastAdmin
}
