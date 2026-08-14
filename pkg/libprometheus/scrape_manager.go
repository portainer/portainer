package libprometheus

import (
	"fmt"
	"time"

	"github.com/portainer/portainer/api/filesystem"
	prometheusreg "github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/common/model"
	"github.com/prometheus/prometheus/config"
	"github.com/prometheus/prometheus/discovery"
	"github.com/prometheus/prometheus/discovery/targetgroup"
	"github.com/prometheus/prometheus/scrape"
	"github.com/prometheus/prometheus/storage"
)

// LoadPrometheusConfig reads and parses dataDir/config.yaml using the
// standard Prometheus config loader.
func LoadPrometheusConfig(dataDir string) (*config.Config, error) {
	path := filesystem.JoinPaths(dataDir, "config.yaml")
	cfg, err := config.LoadFile(path, false, NewZerologSlogger())
	if err != nil {
		return nil, fmt.Errorf("load prometheus config %q: %w", path, err)
	}
	return cfg, nil
}

// NewScrapeManagerFromConfig creates a scrape.Manager from a loaded Prometheus
// config. It also returns a pre-populated target-sets channel ready to pass to
// Manager.Run() — targets are extracted from the config's static_configs so the
// file remains the single source of truth.
func NewScrapeManagerFromConfig(
	cfg *config.Config,
	appendable storage.Appendable,
	reg prometheusreg.Registerer,
) (*scrape.Manager, chan map[string][]*targetgroup.Group, error) {
	// DiscoveryReloadInterval defaults to 5s in Prometheus v0.310.0+.
	// For a single static target this is just the delay before the first scrape;
	// cap it at 1s so startup latency stays acceptable regardless of the
	// configured scrape interval.
	reloadInterval := time.Duration(cfg.GlobalConfig.ScrapeInterval)
	if reloadInterval == 0 || reloadInterval > time.Second {
		reloadInterval = time.Second
	}
	opts := &scrape.Options{
		DiscoveryReloadInterval: model.Duration(reloadInterval),
	}

	mgr, err := scrape.NewManager(opts, NewZerologSlogger(), nil, appendable, nil, reg)
	if err != nil {
		return nil, nil, fmt.Errorf("create scrape manager: %w", err)
	}

	if err := mgr.ApplyConfig(cfg); err != nil {
		return nil, nil, fmt.Errorf("apply prometheus config: %w", err)
	}

	serviceDiscoveryConfigs := make(map[string]discovery.Configs, len(cfg.ScrapeConfigs))
	for _, sc := range cfg.ScrapeConfigs {
		serviceDiscoveryConfigs[sc.JobName] = sc.ServiceDiscoveryConfigs
	}

	return mgr, newStaticTargetSetsChannel(serviceDiscoveryConfigs), nil
}

// newStaticTargetSetsChannel builds the initial target-set payload for manager
// startup from static discovery configs only.
func newStaticTargetSetsChannel(serviceDiscoveryConfigs map[string]discovery.Configs) chan map[string][]*targetgroup.Group {
	tsets := make(map[string][]*targetgroup.Group, len(serviceDiscoveryConfigs))
	for key, configs := range serviceDiscoveryConfigs {
		tsets[key] = staticTargetGroups(configs)
	}

	ch := make(chan map[string][]*targetgroup.Group, 1)
	ch <- tsets
	return ch
}

func staticTargetGroups(serviceDiscoveryConfigs discovery.Configs) []*targetgroup.Group {
	var groups []*targetgroup.Group
	for _, sdCfg := range serviceDiscoveryConfigs {
		if static, ok := sdCfg.(discovery.StaticConfig); ok {
			groups = append(groups, static...)
		}
	}

	return groups
}
