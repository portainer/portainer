package offlinegate

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestBeforeAdminInitTimeout(t *testing.T) {
	// scenario:
	// Before admin init timeout, no redirect happen

	timeoutCh := make(chan interface{})
	o := NewOfflineGateWrapper(timeoutCh)

	request := httptest.NewRequest(http.MethodPost, "/", nil)
	response := httptest.NewRecorder()

	go func() {
		time.Sleep(2 * time.Second)
		timeoutCh <- struct{}{}
	}()

	o.WaitingMiddlewareWrapper(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("success"))
	})).ServeHTTP(response, request)

	body, _ := io.ReadAll(response.Body)
	if string(body) != "success" {
		t.Error("Didn't receive expected result from the hanlder")
	}
}

func TestAfterAdminInitTimeout(t *testing.T) {
	// scenario:
	// After admin init timeout, redirect should happen

	timeoutCh := make(chan interface{})
	o := NewOfflineGateWrapper(timeoutCh)

	request := httptest.NewRequest(http.MethodPost, "/api/settings/public", nil)
	response := httptest.NewRecorder()

	go func() {
		time.Sleep(100 * time.Millisecond)
		timeoutCh <- struct{}{}
	}()

	time.Sleep(300 * time.Millisecond)
	o.WaitingMiddlewareWrapper(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	})).ServeHTTP(response, request)

	if response.Code != http.StatusPermanentRedirect {
		t.Error("Didn't redirect as expected")
	}
}
