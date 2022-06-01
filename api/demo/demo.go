package demo

import (
	"log"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
)

type EnvironmentDetails struct {
	Enabled      bool                   `json:"enabled"`
	Users        []portainer.UserID     `json:"users"`
	Environments []portainer.EndpointID `json:"environments"`
}

type Service struct {
	details EnvironmentDetails
}

func NewService() *Service {
	return &Service{}
}

func (service *Service) Details() EnvironmentDetails {
	return service.details
}

func (service *Service) Init(store dataservices.DataStore, cryptoService portainer.CryptoService) error {
	log.Print("[INFO] [main] Starting demo environment")

	isClean, err := isCleanStore(store)
	if err != nil {
		return errors.WithMessage(err, "failed checking if store is clean")
	}

	if !isClean {
		return errors.New(" Demo environment can only be initialized on a clean database")
	}

	id, err := initDemoUser(store, cryptoService)
	if err != nil {
		return errors.WithMessage(err, "failed creating demo user")
	}

	endpointIds, err := initDemoEndpoints(store)
	if err != nil {
		return errors.WithMessage(err, "failed creating demo endpoint")
	}

	err = initDemoSettings(store)
	if err != nil {
		return errors.WithMessage(err, "failed updating demo settings")
	}

	service.details = EnvironmentDetails{
		Enabled: true,
		Users:   []portainer.UserID{id},
		// endpoints 2,3 are created after deployment of portainer
		Environments: endpointIds,
	}

	return nil
}

func isCleanStore(store dataservices.DataStore) (bool, error) {
	endpoints, err := store.Endpoint().Endpoints()
	if err != nil {
		return false, err
	}

	if len(endpoints) > 0 {
		return false, nil
	}

	users, err := store.User().Users()
	if err != nil {
		return false, err
	}

	if len(users) > 0 {
		return false, nil
	}

	return true, nil
}

func (service *Service) IsDemo() bool {
	return service.details.Enabled
}

func (service *Service) IsDemoEnvironment(environmentID portainer.EndpointID) bool {
	if !service.IsDemo() {
		return false
	}

	for _, demoEndpointID := range service.details.Environments {
		if environmentID == demoEndpointID {
			return true
		}
	}

	return false
}

func (service *Service) IsDemoUser(userID portainer.UserID) bool {
	if !service.IsDemo() {
		return false
	}

	for _, demoUserID := range service.details.Users {
		if userID == demoUserID {
			return true
		}
	}

	return false
}
