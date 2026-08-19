package libprometheus

import (
	"time"

	"github.com/prometheus/prometheus/promql"
)

// NewEngine creates a PromQL engine with standard options shared across
// the server and agent Prometheus embeddings.
func NewEngine() *promql.Engine {
	return promql.NewEngine(promql.EngineOpts{
		MaxSamples:       50_000_000,
		Timeout:          2 * time.Minute,
		EnableAtModifier: true,
	})
}
