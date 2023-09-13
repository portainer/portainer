package edgestacks

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// Inspect
func TestInspectInvalidEdgeID(t *testing.T) {
	handler, rawAPIKey := setupHandler(t)

	cases := []struct {
		Name               string
		EdgeStackID        string
		ExpectedStatusCode int
	}{
		{"Invalid EdgeStackID", "x", 400},
		{"Non-existing EdgeStackID", "5", 404},
	}

	for _, tc := range cases {
		t.Run(tc.Name, func(t *testing.T) {
			req, err := http.NewRequest(http.MethodGet, "/edge_stacks/"+tc.EdgeStackID, nil)
			if err != nil {
				t.Fatal("request error:", err)
			}

			req.Header.Add("x-api-key", rawAPIKey)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			if rec.Code != tc.ExpectedStatusCode {
				t.Fatalf("expected a %d response, found: %d", tc.ExpectedStatusCode, rec.Code)
			}
		})
	}
}
