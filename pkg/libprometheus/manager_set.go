package libprometheus

import (
	"fmt"

	prometheusreg "github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/prometheus/discovery/targetgroup"
	"github.com/prometheus/prometheus/notifier"
	"github.com/prometheus/prometheus/scrape"
	"github.com/prometheus/prometheus/storage"
)

// ManagerSet bundles the Prometheus managers and initial target sets built
// from config.yaml.
type ManagerSet struct {
	ScrapeManager      *scrape.Manager
	ScrapeTargetSets   chan map[string][]*targetgroup.Group
	NotifierManager    *notifier.Manager
	NotifierTargetSets chan map[string][]*targetgroup.Group
}

// BootstrapManagerSet writes config.yaml, loads it back, and builds the scrape
// and notifier managers from that file so config.yaml remains the single source
// of truth for runtime configuration.
func BootstrapManagerSet(
	dataDir string,
	options PrometheusConfigOptions,
	appendable storage.Appendable,
	reg prometheusreg.Registerer,
) (*ManagerSet, error) {
	if err := WritePrometheusConfig(dataDir, options); err != nil {
		return nil, fmt.Errorf("write prometheus config: %w", err)
	}

	cfg, err := LoadPrometheusConfig(dataDir)
	if err != nil {
		return nil, fmt.Errorf("load prometheus config: %w", err)
	}

	scrapeManager, scrapeTargetSets, err := NewScrapeManagerFromConfig(cfg, appendable, reg)
	if err != nil {
		return nil, fmt.Errorf("create scrape manager: %w", err)
	}

	notifierManager, notifierTargetSets, err := NewNotifierManagerFromConfig(cfg, reg)
	if err != nil {
		return nil, fmt.Errorf("create notifier manager: %w", err)
	}

	return &ManagerSet{
		ScrapeManager:      scrapeManager,
		ScrapeTargetSets:   scrapeTargetSets,
		NotifierManager:    notifierManager,
		NotifierTargetSets: notifierTargetSets,
	}, nil
}
