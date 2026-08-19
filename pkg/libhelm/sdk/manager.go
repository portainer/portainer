package sdk

import (
	"time"

	"helm.sh/helm/v4/pkg/cli"
)

// HelmSDKPackageManager is a wrapper for the helm SDK which implements HelmPackageManager
type HelmSDKPackageManager struct {
	settings *cli.EnvSettings
	timeout  time.Duration
}

// NewHelmSDKPackageManager initializes a new HelmPackageManager service using the Helm SDK
func NewHelmSDKPackageManager() *HelmSDKPackageManager {
	settings := cli.New()
	return &HelmSDKPackageManager{
		settings: settings,
		timeout:  300 * time.Second, // 5 minutes default timeout
	}
}
