package settings

import (
	"sync"

	portainer "github.com/portainer/portainer/api"
)

const (
	// BucketName represents the name of the bucket where this service stores data.
	BucketName  = "settings"
	settingsKey = "SETTINGS"
)

// Service represents a service for managing environment(endpoint) data.
type Service struct {
	connection portainer.Connection
	cache      *portainer.Settings
	mu         sync.RWMutex
}

func cloneSettings(src *portainer.Settings) *portainer.Settings {
	if src == nil {
		return nil
	}

	c := *src

	if c.BlackListedLabels != nil {
		c.BlackListedLabels = make([]portainer.Pair, len(src.BlackListedLabels))
		copy(c.BlackListedLabels, src.BlackListedLabels)
	}

	if src.FeatureFlagSettings != nil {
		c.FeatureFlagSettings = make(map[portainer.Feature]bool)
		for k, v := range src.FeatureFlagSettings {
			c.FeatureFlagSettings[k] = v
		}
	}

	return &c
}

func (service *Service) BucketName() string {
	return BucketName
}

// NewService creates a new instance of a service.
func NewService(connection portainer.Connection) (*Service, error) {
	err := connection.SetServiceName(BucketName)
	if err != nil {
		return nil, err
	}

	return &Service{
		connection: connection,
	}, nil
}

// Settings retrieve the settings object.
func (service *Service) Settings() (*portainer.Settings, error) {
	service.mu.RLock()
	if service.cache != nil {
		s := cloneSettings(service.cache)
		service.mu.RUnlock()

		return s, nil
	}
	service.mu.RUnlock()

	service.mu.Lock()
	defer service.mu.Unlock()

	var settings portainer.Settings

	err := service.connection.GetObject(BucketName, []byte(settingsKey), &settings)
	if err != nil {
		return nil, err
	}

	service.cache = cloneSettings(&settings)

	return &settings, nil
}

// UpdateSettings persists a Settings object.
func (service *Service) UpdateSettings(settings *portainer.Settings) error {
	service.mu.Lock()
	defer service.mu.Unlock()

	err := service.connection.UpdateObject(BucketName, []byte(settingsKey), settings)
	if err != nil {
		return err
	}

	service.cache = cloneSettings(settings)

	return nil
}

func (service *Service) IsFeatureFlagEnabled(feature portainer.Feature) bool {
	settings, err := service.Settings()
	if err != nil {
		return false
	}

	featureFlagSetting, ok := settings.FeatureFlagSettings[feature]
	if ok {
		return featureFlagSetting
	}

	return false
}

func (service *Service) InvalidateCache() {
	service.mu.Lock()
	service.cache = nil
	service.mu.Unlock()
}
