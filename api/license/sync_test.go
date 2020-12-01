package license

import (
	"testing"
	"time"
)

func TestSyncInterval(t *testing.T) {
	if syncInterval != 24*time.Hour {
		t.Error("Sync Interval should be 1 day")
	}
}
