package backup

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/adminmonitor"
	"github.com/portainer/portainer/api/demo"
	"github.com/portainer/portainer/api/http/offlinegate"
	i "github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/stretchr/testify/assert"
)

func Test_restoreArchive_usingCombinationOfPasswords(t *testing.T) {
	tests := []struct {
		name            string
		backupPassword  string
		restorePassword string
		fails           bool
	}{
		{
			name:            "empty password to both encrypt and decrypt",
			backupPassword:  "",
			restorePassword: "",
			fails:           false,
		},
		{
			name:            "same password to encrypt and decrypt",
			backupPassword:  "secret",
			restorePassword: "secret",
			fails:           false,
		},
		{
			name:            "different passwords to encrypt and decrypt",
			backupPassword:  "secret",
			restorePassword: "terces",
			fails:           true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			datastore := i.NewDatastore(i.WithUsers([]portainer.User{}), i.WithEdgeJobs([]portainer.EdgeJob{}))
			adminMonitor := adminmonitor.New(time.Hour, datastore, context.Background())

			h := NewHandler(nil, datastore, offlinegate.NewOfflineGate(), "./test_assets/handler_test", func() {}, adminMonitor, &demo.Service{})

			//backup
			archive := backup(t, h, test.backupPassword)

			//restore
			w := httptest.NewRecorder()
			r, err := prepareMultipartRequest(test.restorePassword, archive)
			assert.Nil(t, err, "Shouldn't fail to write multipart form")

			restoreErr := h.restore(w, r)
			assert.Equal(t, test.fails, restoreErr != nil, "Didn't meet expectation of failing restore handler")
		})
	}
}

func Test_restoreArchive_shouldFailIfSystemWasAlreadyInitialized(t *testing.T) {
	admin := portainer.User{
		Role: portainer.AdministratorRole,
	}
	datastore := i.NewDatastore(i.WithUsers([]portainer.User{admin}), i.WithEdgeJobs([]portainer.EdgeJob{}))
	adminMonitor := adminmonitor.New(time.Hour, datastore, context.Background())

	h := NewHandler(nil, datastore, offlinegate.NewOfflineGate(), "./test_assets/handler_test", func() {}, adminMonitor, &demo.Service{})

	//backup
	archive := backup(t, h, "password")

	//restore
	w := httptest.NewRecorder()
	r, err := prepareMultipartRequest("password", archive)
	assert.Nil(t, err, "Shouldn't fail to write multipart form")

	restoreErr := h.restore(w, r)
	assert.NotNil(t, restoreErr, "Should fail, because system it already initialized")
	assert.Equal(t, "Cannot restore already initialized instance", restoreErr.Message, "Should fail with certain error")
}

func backup(t *testing.T, h *Handler, password string) []byte {
	r := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(fmt.Sprintf(`{"password":"%s"}`, password)))
	w := httptest.NewRecorder()

	backupErr := h.backup(w, r)
	assert.Nil(t, backupErr, "Backup should not fail")

	response := w.Result()
	archive, _ := io.ReadAll(response.Body)
	return archive
}

func prepareMultipartRequest(password string, file []byte) (*http.Request, error) {
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	err := w.WriteField("password", password)
	if err != nil {
		return nil, err
	}
	fw, err := w.CreateFormFile("file", "filename")
	if err != nil {
		return nil, err
	}
	io.Copy(fw, bytes.NewReader(file))

	r := httptest.NewRequest(http.MethodPost, "http://localhost/", &body)
	r.Header.Set("Content-Type", w.FormDataContentType())

	w.Close()

	return r, nil
}
