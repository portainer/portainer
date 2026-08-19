package libprometheus

import (
	"fmt"
	"net/url"
	"os"
	"sort"
	"strings"

	"github.com/portainer/portainer/api/filesystem"
)

const configTemplate = `# Prometheus configuration.
# Generated automatically — do not edit.
global:
  scrape_interval: %s
  evaluation_interval: %s

scrape_configs:
  - job_name: '%s'
    scheme: '%s'
    metrics_path: '%s'
%s    static_configs:
      - targets: ['%s']

%s
`

const alertingTemplate = `alerting:
  alertmanagers:
  - scheme: '%s'
    path_prefix: '%s'
    api_version: 'v2'
    static_configs:
      - targets: ['%s']
%s
`

type PrometheusConfigOptions struct {
	ScrapeInterval      string
	JobName             string
	ScrapeTarget        string
	AlertmanagerTarget  string
	AlertmanagerHeaders map[string]string
	InsecureSkipVerify  bool
}

// WritePrometheusConfig writes a Prometheus config.yaml to dataDir/config.yaml.
// ScrapeTarget is a full scrape URL (e.g. "http://localhost:9001/api/metrics").
// AlertmanagerTarget is an optional base URL used by Prometheus notifier
// (e.g. "https://portainer.example/api/endpoints/1/edge/alerts").
func WritePrometheusConfig(dataDir string, options PrometheusConfigOptions) error {
	if err := os.MkdirAll(dataDir, 0o750); err != nil {
		return fmt.Errorf("create prometheus config dir: %w", err)
	}

	scheme, metricsPath, hostPort, err := parseTarget(options.ScrapeTarget, "/metrics")
	if err != nil {
		return fmt.Errorf("parse scrape target: %w", err)
	}

	escape := func(s string) string { return strings.ReplaceAll(s, "'", "''") }
	alertingSection, err := renderAlertingSection(options.AlertmanagerTarget, options.AlertmanagerHeaders, options.InsecureSkipVerify, escape)
	if err != nil {
		return err
	}

	scrapeTLSBlock := ""
	if scheme == "https" && options.InsecureSkipVerify {
		scrapeTLSBlock = "    tls_config:\n      insecure_skip_verify: true\n"
	}

	content := fmt.Sprintf(configTemplate,
		options.ScrapeInterval, options.ScrapeInterval,
		escape(options.JobName),
		escape(scheme),
		escape(metricsPath),
		scrapeTLSBlock,
		escape(hostPort),
		alertingSection,
	)

	return os.WriteFile(filesystem.JoinPaths(dataDir, "config.yaml"), []byte(content), 0o600)
}

// parseTarget splits a full URL into its scheme, path, and host:port components
// for use in a Prometheus static_configs entry.
func parseTarget(target string, defaultPath string) (scheme, parsedPath, hostPort string, err error) {
	u, err := url.Parse(target)
	if err != nil {
		return "", "", "", err
	}

	scheme = u.Scheme
	if scheme == "" {
		scheme = "http"
	}

	parsedPath = u.Path
	if parsedPath == "" {
		parsedPath = defaultPath
	}

	hostPort = u.Host
	if hostPort == "" {
		hostPort = target // fallback: treat the whole string as host:port
	}

	return scheme, parsedPath, hostPort, nil
}
func renderAlertingSection(target string, headers map[string]string, insecureSkipVerify bool, escape func(string) string) (string, error) {
	if target == "" {
		return "", nil
	}

	scheme, pathPrefix, hostPort, err := parseTarget(target, "")
	if err != nil {
		return "", fmt.Errorf("parse alertmanager target: %w", err)
	}

	tlsBlock := ""
	if insecureSkipVerify {
		tlsBlock = "    tls_config:\n      insecure_skip_verify: true\n"
	}
	headersBlock := renderHTTPHeaders(headers, escape, "    ")
	return fmt.Sprintf(alertingTemplate,
		escape(scheme),
		escape(pathPrefix),
		escape(hostPort),
		tlsBlock+headersBlock,
	), nil
}

func renderHTTPHeaders(headers map[string]string, escape func(string) string, indent string) string {
	if len(headers) == 0 {
		return ""
	}

	keys := make([]string, 0, len(headers))
	for name := range headers {
		keys = append(keys, name)
	}
	sort.Strings(keys)

	var builder strings.Builder
	_, _ = fmt.Fprintf(&builder, "%shttp_headers:\n", indent)
	for _, name := range keys {
		_, _ = fmt.Fprintf(&builder, "%s  %s:\n", indent, name)
		_, _ = fmt.Fprintf(&builder, "%s    values: ['%s']\n", indent, escape(headers[name]))
	}

	return builder.String()
}
