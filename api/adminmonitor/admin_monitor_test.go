package adminmonitor

import (
	"testing"
	"testing/synctest"
	"time"

	portainer "github.com/portainer/portainer/api"
	i "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func Test_stopWithoutStarting(t *testing.T) {
	t.Parallel()
	monitor := New(1*time.Minute, nil)
	monitor.Stop()
}

func Test_stopCouldBeCalledMultipleTimes(t *testing.T) {
	t.Parallel()
	monitor := New(1*time.Minute, nil)
	monitor.Stop()
	monitor.Stop()
}

func Test_startOrStopCouldBeCalledMultipleTimesConcurrently(t *testing.T) {
	t.Parallel()
	synctest.Test(t, test_startOrStopCouldBeCalledMultipleTimesConcurrently)
}

func test_startOrStopCouldBeCalledMultipleTimesConcurrently(t *testing.T) {
	monitor := New(1*time.Minute, nil)

	go monitor.Start(t.Context())
	monitor.Start(t.Context())

	go monitor.Stop()
	monitor.Stop()

	time.Sleep(2 * time.Second)
}

func Test_canStopStartedMonitor(t *testing.T) {
	t.Parallel()
	monitor := New(1*time.Minute, nil)
	monitor.Start(t.Context())
	assert.NotNil(t, monitor.cancellationFunc, "cancellation function is missing in started monitor")

	monitor.Stop()
	assert.Nil(t, monitor.cancellationFunc, "cancellation function should absent in stopped monitor")
}

func Test_start_shouldDisableInstanceAfterTimeout_ifNotInitialized(t *testing.T) {
	t.Parallel()
	timeout := 10 * time.Millisecond

	datastore := i.NewDatastore(i.WithUsers([]portainer.User{}))
	monitor := New(timeout, datastore)
	monitor.Start(t.Context())

	<-time.After(20 * timeout)
	assert.True(t, monitor.WasInstanceDisabled(), "monitor should have been timeout and instance is disabled")
}
