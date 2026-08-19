package sdk

import (
	"testing"
	"time"

	"github.com/portainer/portainer/pkg/libhelm/types"

	"github.com/stretchr/testify/assert"
)

func Test_NewHelmSDKPackageManager(t *testing.T) {
	t.Parallel()
	is := assert.New(t)

	// Test that NewHelmSDKPackageManager returns a non-nil HelmPackageManager
	manager := NewHelmSDKPackageManager()
	is.NotNil(manager, "should return non-nil HelmPackageManager")

	// Test that the manager has the expected fields
	is.NotNil(manager.settings, "should have non-nil settings")
	is.Equal(300*time.Second, manager.timeout, "should have 5 minute timeout")

	// Test that the manager implements the HelmPackageManager interface
	var _ types.HelmPackageManager = manager
}
