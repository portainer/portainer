package allowlist

import (
	"fmt"

	lru "github.com/hashicorp/golang-lru"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
)

const (
	BucketName = "allowlist"
)

type Service struct {
	baseService dataservices.BaseDataService[portainer.AllowList, portainer.AllowListKey]
	cache       *lru.Cache
}

func (service *Service) BucketName() string {
	return service.baseService.BucketName()
}

func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	service := &Service{
		baseService: dataservices.BaseDataService[portainer.AllowList, portainer.AllowListKey]{
			Bucket:     BucketName,
			Connection: connection,
		},
	}

	err = service.populateCache()

	return service, err
}

func (service *Service) populateCache() error {
	allowListKeys := []portainer.AllowListKey{portainer.AllowListSSRF}
	cache, err := lru.New(len(allowListKeys))
	if err != nil {
		return err
	}

	for _, k := range allowListKeys {
		allowList, err := service.baseService.Read(k)
		if dataservices.IsErrObjectNotFound(err) {
			allowList = &portainer.AllowList{
				ID:      k,
				Mode:    portainer.SSRFModeOff,
				Entries: []string{},
			}
		} else if err != nil {
			return err
		}

		parsedAllowList := ssrf.ParseAllowedHosts(allowList.Entries)
		parsedAllowList.Mode = allowList.Mode

		cache.Add(k, &parsedAllowList)
	}

	service.cache = cache

	return nil
}

func (service *Service) Tx(tx portainer.Transaction) *ServiceTx {
	return &ServiceTx{
		baseService: service.baseService.Tx(tx),
		cache:       service.cache,
	}
}

func (service *Service) Read(id portainer.AllowListKey) (*portainer.AllowList, error) {
	var result *portainer.AllowList
	if err := service.baseService.Connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		result, err = service.Tx(tx).Read(id)
		return err
	}); err != nil {
		return nil, err
	}

	return result, nil
}

func (service *Service) ReadAll() ([]portainer.AllowList, error) {
	var result []portainer.AllowList
	if err := service.baseService.Connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		result, err = service.Tx(tx).ReadAll()
		return err
	}); err != nil {
		return nil, err
	}

	return result, nil
}

func (service *Service) ReadParsed(id portainer.AllowListKey) (*portainer.ParsedAllowList, error) {
	allowListAny, ok := service.cache.Get(id)
	if ok {
		allowList, ok := allowListAny.(*portainer.ParsedAllowList)
		if !ok {
			return nil, fmt.Errorf("expected ParsedAllowList in cache but got %T", allowListAny)
		}

		return allowList, nil
	}

	var result *portainer.ParsedAllowList
	err := service.baseService.Connection.ViewTx(func(tx portainer.Transaction) error {
		var err error
		result, err = service.Tx(tx).ReadParsed(id)
		return err
	})

	return result, err
}

func (service *Service) Update(id portainer.AllowListKey, allowList *portainer.AllowList) error {
	return service.baseService.Connection.UpdateTx(func(tx portainer.Transaction) error {
		return service.Tx(tx).Update(id, allowList)
	})
}
