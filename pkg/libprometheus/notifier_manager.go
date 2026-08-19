package libprometheus

import (
	"fmt"

	prometheusreg "github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/common/model"
	"github.com/prometheus/prometheus/config"
	"github.com/prometheus/prometheus/discovery"
	"github.com/prometheus/prometheus/discovery/targetgroup"
	"github.com/prometheus/prometheus/notifier"
)

// NewNotifierManagerFromConfig creates a notifier.Manager from a loaded
// Prometheus config. It also returns a pre-populated target-sets channel ready
// to pass to Manager.Run() using the config's static alertmanager targets.
func NewNotifierManagerFromConfig(
	cfg *config.Config,
	reg prometheusreg.Registerer,
) (*notifier.Manager, chan map[string][]*targetgroup.Group, error) {
	mgr := notifier.NewManager(
		&notifier.Options{
			QueueCapacity:   10000,
			DrainOnShutdown: true,
			Registerer:      reg,
		},
		model.LegacyValidation,
		NewZerologSlogger(),
	)

	if err := mgr.ApplyConfig(cfg); err != nil {
		return nil, nil, fmt.Errorf("apply prometheus notifier config: %w", err)
	}

	alertmanagerConfigs := cfg.AlertingConfig.AlertmanagerConfigs.ToMap()
	serviceDiscoveryConfigs := make(map[string]discovery.Configs, len(alertmanagerConfigs))
	for key, amCfg := range alertmanagerConfigs {
		serviceDiscoveryConfigs[key] = amCfg.ServiceDiscoveryConfigs
	}

	return mgr, newStaticTargetSetsChannel(serviceDiscoveryConfigs), nil
}
