package allowlist

import (
	"fmt"

	lru "github.com/hashicorp/golang-lru"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"
)

type ServiceTx struct {
	baseService dataservices.BaseDataServiceTx[portainer.AllowList, portainer.AllowListKey]
	cache       *lru.Cache
}

func (service *ServiceTx) BucketName() string {
	return service.baseService.BucketName()
}

func (service *ServiceTx) ReadParsed(id portainer.AllowListKey) (*portainer.ParsedAllowList, error) {
	allowListAny, ok := service.cache.Get(id)
	if ok {
		allowList, ok := allowListAny.(*portainer.ParsedAllowList)
		if !ok {
			return nil, fmt.Errorf("expected ParsedAllowList in cache but got %T", allowListAny)
		}

		return allowList, nil
	}

	allowList, err := service.Read(id)
	if err != nil {
		return nil, err
	}

	parsed := ssrf.ParseAllowedHosts(allowList.Entries)
	parsed.Mode = allowList.Mode
	service.cache.Add(id, &parsed)

	return &parsed, nil
}

func (service *ServiceTx) Read(id portainer.AllowListKey) (*portainer.AllowList, error) {
	allowList, err := service.baseService.Read(id)
	if dataservices.IsErrObjectNotFound(err) {
		allowList = &portainer.AllowList{
			ID:      id,
			Mode:    portainer.SSRFModeOff,
			Entries: []string{},
		}
	} else if err != nil {
		return nil, err
	}

	return allowList, nil
}

func (service *ServiceTx) ReadAll() ([]portainer.AllowList, error) {
	allowLists, err := service.baseService.ReadAll()
	if err != nil && !dataservices.IsErrObjectNotFound(err) {
		return nil, err
	}

	return allowLists, nil
}

func (service *ServiceTx) Update(id portainer.AllowListKey, allowList *portainer.AllowList) error {
	if err := service.baseService.Update(id, allowList); err != nil {
		return err
	}

	parsed := ssrf.ParseAllowedHosts(allowList.Entries)
	parsed.Mode = allowList.Mode
	service.cache.Add(id, &parsed)
	return nil
}
