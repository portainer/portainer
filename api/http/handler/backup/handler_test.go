package backup

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/portainer/portainer/api/adminmonitor"
	"github.com/portainer/portainer/api/http/offlinegate"
	i "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func Test_demoEnvironment_shouldFail(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{}`))
	w := httptest.NewRecorder()

	gate := offlinegate.NewOfflineGate()
	adminMonitor := adminmonitor.New(time.Hour, nil, context.Background())

	handler := NewHandler(nil, i.NewDatastore(), gate, "./test_assets/handler_test", nil, func() {}, adminMonitor, true)

	handler.restrictDemoEnv(http.DefaultServeMux).ServeHTTP(w, r)

	response := w.Result()
	assert.Equal(t, response.StatusCode, http.StatusBadRequest)

	body, _ := io.ReadAll(response.Body)
	assert.Contains(t, string(body), "This feature is not available in the demo version of Portainer")
}
