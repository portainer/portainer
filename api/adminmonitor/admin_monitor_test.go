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
	monitor := New(1*time.Minute, nil, nil, nil)
	monitor.Stop()
}

func Test_stopCouldBeCalledMultipleTimes(t *testing.T) {
	monitor := New(1*time.Minute, nil, nil, nil)
	monitor.Stop()
	monitor.Stop()
}

func Test_startOrStopCouldBeCalledMultipleTimesConcurrently(t *testing.T) {
	monitor := New(1*time.Minute, nil, nil, context.Background())

	go monitor.Start()
	monitor.Start()

	go monitor.Stop()
	monitor.Stop()

	time.Sleep(2 * time.Second)
}

func Test_canStopStartedMonitor(t *testing.T) {
	monitor := New(1*time.Minute, nil, nil, context.Background())
	monitor.Start()
	assert.NotNil(t, monitor.cancellationFunc, "cancellation function is missing in started monitor")

	monitor.Stop()
	assert.Nil(t, monitor.cancellationFunc, "cancellation function should absent in stopped monitor")
}

func Test_start_shouldSendSignalAfterTimeout_ifNotInitialized(t *testing.T) {
	timeout := 10 * time.Millisecond

	initTimeoutSignal := make(chan interface{})

	datastore := i.NewDatastore(i.WithUsers([]portainer.User{}))
	monitor := New(timeout, datastore, initTimeoutSignal, context.Background())
	monitor.Start()

	<-time.After(20 * timeout)
	_, ok := <-initTimeoutSignal
	assert.False(t, ok, "monitor should have been timeout and sent init timeout signal out")
}
