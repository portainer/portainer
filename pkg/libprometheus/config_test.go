package libprometheus_test

import (
	"testing"
	"time"

	libprom "github.com/portainer/portainer/pkg/libprometheus"
	prometheusreg "github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/common/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestWritePrometheusConfigIncludesAlertmanagerSettings(t *testing.T) {
	dataDir := t.TempDir()

	err := libprom.WritePrometheusConfig(dataDir, libprom.PrometheusConfigOptions{
		ScrapeInterval:     "60s",
		JobName:            "edge-agent",
		ScrapeTarget:       "http://localhost:9001/api/metrics",
		AlertmanagerTarget: "https://portainer.example/api/endpoints/7/edge/alerts",
		AlertmanagerHeaders: map[string]string{
			"X-PortainerAgent-EdgeID": "edge-id-7",
		},
	})
	require.NoError(t, err)

	cfg, err := libprom.LoadPrometheusConfig(dataDir)
	require.NoError(t, err)

	require.Len(t, cfg.ScrapeConfigs, 1)
	assert.Equal(t, "edge-agent", cfg.ScrapeConfigs[0].JobName)
	assert.Equal(t, model.Duration(60*time.Second), cfg.GlobalConfig.ScrapeInterval)

	require.Len(t, cfg.AlertingConfig.AlertmanagerConfigs, 1)
	amCfg := cfg.AlertingConfig.AlertmanagerConfigs[0]
	assert.Equal(t, "https", amCfg.Scheme)
	assert.Equal(t, "/api/endpoints/7/edge/alerts", amCfg.PathPrefix)
	require.NotNil(t, amCfg.HTTPClientConfig.HTTPHeaders)
	require.Contains(t, amCfg.HTTPClientConfig.HTTPHeaders.Headers, "X-PortainerAgent-EdgeID")
	assert.Equal(t, []string{"edge-id-7"}, amCfg.HTTPClientConfig.HTTPHeaders.Headers["X-PortainerAgent-EdgeID"].Values)

	notifierMgr, tsets, err := libprom.NewNotifierManagerFromConfig(cfg, prometheusreg.NewRegistry())
	require.NoError(t, err)
	require.NotNil(t, notifierMgr)

	tset := <-tsets
	require.Contains(t, tset, "config-0")
	require.Len(t, tset["config-0"], 1)
	require.Len(t, tset["config-0"][0].Targets, 1)
	assert.Equal(t, model.LabelValue("portainer.example"), tset["config-0"][0].Targets[0][model.AddressLabel])
}

func TestWritePrometheusConfigInsecureSkipVerify(t *testing.T) {
	dataDir := t.TempDir()

	err := libprom.WritePrometheusConfig(dataDir, libprom.PrometheusConfigOptions{
		ScrapeInterval:     "60s",
		JobName:            "edge-agent",
		ScrapeTarget:       "http://10.244.0.15:9001/api/metrics",
		AlertmanagerTarget: "https://192.168.68.52:9443/api/endpoints/9/edge/alerts",
		InsecureSkipVerify: true,
	})
	require.NoError(t, err)

	cfg, err := libprom.LoadPrometheusConfig(dataDir)
	require.NoError(t, err)

	require.Len(t, cfg.AlertingConfig.AlertmanagerConfigs, 1)
	amCfg := cfg.AlertingConfig.AlertmanagerConfigs[0]
	assert.True(t, amCfg.HTTPClientConfig.TLSConfig.InsecureSkipVerify)
}

func TestWritePrometheusConfigHTTPSScrapeWithInsecureSkipVerify(t *testing.T) {
	dataDir := t.TempDir()

	err := libprom.WritePrometheusConfig(dataDir, libprom.PrometheusConfigOptions{
		ScrapeInterval:     "15s",
		JobName:            "portainer",
		ScrapeTarget:       "https://127.0.0.1:9443/api/metrics",
		AlertmanagerTarget: "http://127.0.0.1:9093",
		InsecureSkipVerify: true,
	})
	require.NoError(t, err)

	cfg, err := libprom.LoadPrometheusConfig(dataDir)
	require.NoError(t, err)

	require.Len(t, cfg.ScrapeConfigs, 1)
	scrapeCfg := cfg.ScrapeConfigs[0]
	assert.Equal(t, "https", scrapeCfg.Scheme)
	assert.True(t, scrapeCfg.HTTPClientConfig.TLSConfig.InsecureSkipVerify)
}

func TestBootstrapManagerSetBuildsInitialScrapeAndNotifierTargets(t *testing.T) {
	dataDir := t.TempDir()
	reg := prometheusreg.NewRegistry()
	db, err := libprom.NewInMemoryTSDB(reg)
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, db.Close()) })

	managers, err := libprom.BootstrapManagerSet(dataDir, libprom.PrometheusConfigOptions{
		ScrapeInterval:     "60s",
		JobName:            "edge-agent",
		ScrapeTarget:       "http://localhost:9001/api/metrics",
		AlertmanagerTarget: "https://portainer.example/api/endpoints/7/edge/alerts",
	}, db, reg)
	require.NoError(t, err)
	require.NotNil(t, managers.ScrapeManager)
	require.NotNil(t, managers.NotifierManager)

	scrapeTset := <-managers.ScrapeTargetSets
	require.Contains(t, scrapeTset, "edge-agent")
	require.Len(t, scrapeTset["edge-agent"], 1)
	require.Len(t, scrapeTset["edge-agent"][0].Targets, 1)
	assert.Equal(t, model.LabelValue("localhost:9001"), scrapeTset["edge-agent"][0].Targets[0][model.AddressLabel])

	notifyTset := <-managers.NotifierTargetSets
	require.Contains(t, notifyTset, "config-0")
	require.Len(t, notifyTset["config-0"], 1)
	require.Len(t, notifyTset["config-0"][0].Targets, 1)
	assert.Equal(t, model.LabelValue("portainer.example"), notifyTset["config-0"][0].Targets[0][model.AddressLabel])
}
