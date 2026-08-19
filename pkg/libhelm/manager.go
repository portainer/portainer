package libhelm

import (
	"github.com/portainer/portainer/pkg/libhelm/sdk"
	"github.com/portainer/portainer/pkg/libhelm/types"
)

// NewHelmPackageManager returns a new instance of HelmPackageManager based on HelmConfig
func NewHelmPackageManager() types.HelmPackageManager {
	return sdk.NewHelmSDKPackageManager()
}
