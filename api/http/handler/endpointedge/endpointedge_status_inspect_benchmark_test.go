package endpointedge

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/edge/cache"
)

// discardResponseWriter is a header.Set/WriteHeader sink that avoids the
// per-iteration allocation httptest.NewRecorder() would add, so benchmark
// results reflect respondFromCache itself rather than recorder setup.
type discardResponseWriter struct {
	header http.Header
}

func (w *discardResponseWriter) Header() http.Header         { return w.header }
func (w *discardResponseWriter) Write(b []byte) (int, error) { return len(b), nil }
func (w *discardResponseWriter) WriteHeader(int)             {}

// respondFromCache is hit on every single sync-poll request from every Edge
// agent (package/agent/edge/poll.go always sends If-None-Match once it has
// received a prior ETag). These benchmarks isolate that hot loop from the
// rest of the handler.
func benchmarkRespondFromCache(b *testing.B, endpointID portainer.EndpointID, ifNoneMatch string) {
	handler := mustSetupHandler(b)

	endpoint := portainer.Endpoint{
		ID:     endpointID,
		Name:   "bench-endpoint-" + strconv.Itoa(int(endpointID)),
		Type:   portainer.EdgeAgentOnDockerEnvironment,
		EdgeID: "edge-id",
	}
	if err := createEndpoint(handler, endpoint, portainer.EndpointRelation{EndpointID: endpointID}); err != nil {
		b.Fatal(err)
	}

	cache.Set(endpointID, []byte("cached-etag-value"))

	req := httptest.NewRequest(http.MethodGet, "/api/endpoints/edge/status", nil)
	if ifNoneMatch != "" {
		req.Header.Set("If-None-Match", ifNoneMatch)
	}

	w := &discardResponseWriter{header: make(http.Header)}

	b.ReportAllocs()

	for b.Loop() {
		handler.respondFromCache(w, req, endpointID)
	}
}

func BenchmarkRespondFromCache_Match(b *testing.B) {
	benchmarkRespondFromCache(b, 90001, "cached-etag-value")
}

func BenchmarkRespondFromCache_MatchAmongMultiple(b *testing.B) {
	benchmarkRespondFromCache(b, 90002, "other-etag-1,other-etag-2,cached-etag-value")
}

func BenchmarkRespondFromCache_NoMatch(b *testing.B) {
	benchmarkRespondFromCache(b, 90003, "some-stale-etag")
}

func BenchmarkRespondFromCache_NoHeader(b *testing.B) {
	benchmarkRespondFromCache(b, 90004, "")
}
