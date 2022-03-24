package middlewares

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func Test_beforeAdminInitDisabled(t *testing.T) {
	// scenario:
	// Before admin init timeout, no redirect happen

	timeoutSignal := make(chan interface{})
	adminMonitorMiddleware := NewAdminMonitor(timeoutSignal)

	request := httptest.NewRequest(http.MethodPost, "/api/settings/public", nil)
	response := httptest.NewRecorder()

	go func() {
		time.Sleep(2 * time.Second)
		close(timeoutSignal)
	}()

	adminMonitorMiddleware.WithRedirect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("success"))
	})).ServeHTTP(response, request)

	body, _ := io.ReadAll(response.Body)
	if string(body) != "success" {
		t.Error("Didn't receive expected result from the hanlder")
	}
}

func Test_afterAdminInitDisabled(t *testing.T) {
	// scenario:
	// After admin init timeout, redirect should happen

	timeoutSignal := make(chan interface{})
	adminMonitorMiddleware := NewAdminMonitor(timeoutSignal)

	request := httptest.NewRequest(http.MethodPost, "/api/users/admin/check", nil)
	response := httptest.NewRecorder()

	go func() {
		time.Sleep(100 * time.Millisecond)
		close(timeoutSignal)
	}()

	time.Sleep(300 * time.Millisecond)
	adminMonitorMiddleware.WithRedirect(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	})).ServeHTTP(response, request)

	if response.Code != http.StatusTemporaryRedirect {
		t.Error("Didn't redirect as expected")
	}
}
