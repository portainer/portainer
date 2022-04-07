package offlinegate

import (
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func Test_canLockAndUnlock(t *testing.T) {
	o := NewOfflineGate()

	unlock := o.Lock()
	unlock()
}

func Test_hasToBeUnlockedToLockAgain(t *testing.T) {
	// scenario:
	// 1. first routine starts and locks the gate
	// 2. first routine starts a second and wait for the second to start
	// 3. second start but waits for the gate to be released
	// 4. first continues and unlocks the gate, when done
	// 5. second be able to continue
	// 6. second lock the gate, does the job and unlocks it

	o := NewOfflineGate()

	wg := sync.WaitGroup{}
	wg.Add(2)

	result := make([]string, 0, 2)
	go func() {
		unlock := o.Lock()
		defer unlock()
		waitForSecondToStart := sync.WaitGroup{}
		waitForSecondToStart.Add(1)
		go func() {
			waitForSecondToStart.Done()
			unlock := o.Lock()
			defer unlock()
			result = append(result, "second")
			wg.Done()
		}()
		waitForSecondToStart.Wait()
		result = append(result, "first")
		wg.Done()
	}()

	wg.Wait()

	if len(result) != 2 || result[0] != "first" || result[1] != "second" {
		t.Error("Second call have disresregarded a raised lock")
	}

}

func Test_waitingMiddleware_executesImmediately_whenNotLocked(t *testing.T) {
	// scenario:
	// 1. create an gate
	// 2. kick off a waiting middleware that will release immediately as gate wasn't locked
	// 3. middleware shouldn't timeout

	o := NewOfflineGate()

	request := httptest.NewRequest(http.MethodPost, "/", nil)
	response := httptest.NewRecorder()

	timeout := 2 * time.Second
	start := time.Now()
	o.WaitingMiddleware(timeout, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		elapsed := time.Since(start)
		if elapsed >= timeout {
			t.Error("WaitingMiddleware had likely timeout, when it shouldn't")
		}
		w.Write([]byte("success"))
	})).ServeHTTP(response, request)

	body, _ := io.ReadAll(response.Body)
	if string(body) != "success" {
		t.Error("Didn't receive expected result from the hanlder")
	}
}

func Test_waitingMiddleware_waitsForTheLockToBeReleased(t *testing.T) {
	// scenario:
	// 1. create an gate and lock it
	// 2. kick off a routing that will unlock the gate after 1 second
	// 3. kick off a waiting middleware that will wait for lock to be eventually released
	// 4. middleware shouldn't timeout

	o := NewOfflineGate()
	unlock := o.Lock()

	request := httptest.NewRequest(http.MethodPost, "/", nil)
	response := httptest.NewRecorder()

	go func() {
		time.Sleep(1 * time.Second)
		unlock()
	}()

	timeout := 10 * time.Second
	start := time.Now()
	o.WaitingMiddleware(timeout, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		elapsed := time.Since(start)
		if elapsed >= timeout {
			t.Error("WaitingMiddleware had likely timeout, when it shouldn't")
		}
		w.Write([]byte("success"))
	})).ServeHTTP(response, request)

	body, _ := io.ReadAll(response.Body)
	if string(body) != "success" {
		t.Error("Didn't receive expected result from the hanlder")
	}
}

func Test_waitingMiddleware_mayTimeout_whenLockedForTooLong(t *testing.T) {
	/*
		scenario:
		1. create an gate and lock it
		2. kick off a waiting middleware that will wait for lock to be eventually released
		3. because we never unlocked the gate, middleware suppose to timeout
	*/
	o := NewOfflineGate()
	o.Lock()

	request := httptest.NewRequest(http.MethodPost, "/", nil)
	response := httptest.NewRecorder()

	timeout := 1 * time.Second
	start := time.Now()
	o.WaitingMiddleware(timeout, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		elapsed := time.Since(start)
		if elapsed < timeout {
			t.Error("WaitingMiddleware suppose to timeout, but it didnt")
		}
		w.Write([]byte("success"))
	})).ServeHTTP(response, request)

	assert.Equal(t, http.StatusRequestTimeout, response.Result().StatusCode, "Request support to timeout waiting for the gate")
}
