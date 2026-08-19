package schedule

import (
	"context"
	"time"
)

// RunOnInterval calls fn on every tick of a ticker with the given interval,
// stopping when ctx is done. If cleanup is non-nil it is called once after
// the context is cancelled and before the function returns. The ticker is
// always stopped before returning.
func RunOnInterval(ctx context.Context, interval time.Duration, fn func(), cleanup func()) {
	if cleanup != nil {
		defer cleanup()
	}

	if fn == nil {
		return
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			fn()
		case <-ctx.Done():
			return
		}
	}
}
