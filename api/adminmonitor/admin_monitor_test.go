package adminmonitor

import (
	"context"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	i "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func Test_stopWithoutStarting(t *testing.T) {
	monitor := New(1*time.Minute, nil, nil)
	monitor.Stop()
}

func Test_stopCouldBeCalledMultipleTimes(t *testing.T) {
	monitor := New(1*time.Minute, nil, nil)
	monitor.Stop()
	monitor.Stop()
}

func Test_canStopStartedMonitor(t *testing.T) {
	monitor := New(1*time.Minute, nil, context.Background())
	monitor.Start()
	assert.NotNil(t, monitor.cancellationFunc, "cancellation function is missing in started monitor")

	monitor.Stop()
	assert.Nil(t, monitor.cancellationFunc, "cancellation function should absent in stopped monitor")
}

func Test_start_shouldFatalAfterTimeout_ifNotInitialized(t *testing.T) {
	timeout := 10 * time.Millisecond

	datastore := i.NewDatastore(i.WithUsers([]portainer.User{}))

	var fataled bool
	origLogFatalf := logFatalf
	logFatalf = func(s string, v ...interface{}) { fataled = true }
	defer func() {
		logFatalf = origLogFatalf
	}()

	monitor := New(timeout, datastore, context.Background())
	monitor.Start()
	<-time.After(2 * timeout)

	assert.True(t, fataled, "monitor should been timeout and fatal")
}
