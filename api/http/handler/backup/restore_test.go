package backup

import (
	"bytes"
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
	"github.com/portainer/portainer/api/http/offlinegate"
	"github.com/portainer/portainer/api/http/security/setuptoken"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_restoreArchive_usingCombinationOfPasswords(t *testing.T) {
	t.Parallel()
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
			datastore := testhelpers.NewDatastore(
				testhelpers.WithUsers([]portainer.User{}),
				testhelpers.WithEdgeJobs([]portainer.EdgeJob{}),
			)
			adminMonitor := adminmonitor.New(time.Hour, datastore)

			h := NewHandler(
				testhelpers.NewTestRequestBouncer(),
				datastore,
				offlinegate.NewOfflineGate(),
				prepareFilestorePath(t),
				func() {},
				adminMonitor,
			)

			// backup
			archive := backup(t, h, test.backupPassword)

			// restore
			w := httptest.NewRecorder()
			r := prepareMultipartRequest(t, test.restorePassword, archive)

			restoreErr := h.restore(w, r)
			assert.Equal(t, test.fails, restoreErr != nil, "Didn't meet expectation of failing restore handler")
		})
	}
}

func Test_restoreArchive_shouldFailIfSystemWasAlreadyInitialized(t *testing.T) {
	t.Parallel()
	admin := portainer.User{
		Role: portainer.AdministratorRole,
	}
	datastore := testhelpers.NewDatastore(
		testhelpers.WithUsers([]portainer.User{admin}),
		testhelpers.WithEdgeJobs([]portainer.EdgeJob{}),
	)
	adminMonitor := adminmonitor.New(time.Hour, datastore)

	h := NewHandler(testhelpers.NewTestRequestBouncer(),
		datastore,
		offlinegate.NewOfflineGate(),
		prepareFilestorePath(t),
		func() {},
		adminMonitor,
	)

	// backup
	archive := backup(t, h, "password")

	// restore
	w := httptest.NewRecorder()
	r := prepareMultipartRequest(t, "password", archive)

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
	archive, err := io.ReadAll(response.Body)
	require.NoError(t, err)

	err = response.Body.Close()
	require.NoError(t, err)

	return archive
}

func Test_restore_setupTokenGate(t *testing.T) {
	t.Parallel()
	datastore := testhelpers.NewDatastore(
		testhelpers.WithUsers([]portainer.User{}),
		testhelpers.WithEdgeJobs([]portainer.EdgeJob{}),
	)
	adminMonitor := adminmonitor.New(time.Hour, datastore)
	h := NewHandler(
		testhelpers.NewTestRequestBouncer(),
		datastore,
		offlinegate.NewOfflineGate(),
		prepareFilestorePath(t),
		func() {},
		adminMonitor,
	)
	h.SetupToken = "secret-token"

	t.Run("403 without token header", func(t *testing.T) {
		err := h.restore(httptest.NewRecorder(), prepareMultipartRequest(t, "", []byte("x")))
		require.Error(t, err)
		assert.Equal(t, http.StatusForbidden, err.StatusCode)
	})

	t.Run("403 with wrong token", func(t *testing.T) {
		r := prepareMultipartRequest(t, "", []byte("x"))
		r.Header.Set(setuptoken.HeaderName, "wrong")
		err := h.restore(httptest.NewRecorder(), r)
		require.Error(t, err)
		assert.Equal(t, http.StatusForbidden, err.StatusCode)
	})

	t.Run("passes gate with correct token", func(t *testing.T) {
		archive := backup(t, h, "")
		r := prepareMultipartRequest(t, "", archive)
		r.Header.Set(setuptoken.HeaderName, "secret-token")
		require.Nil(t, h.restore(httptest.NewRecorder(), r))
	})
}

func prepareMultipartRequest(t *testing.T, password string, file []byte) *http.Request {
	var body bytes.Buffer

	w := multipart.NewWriter(&body)
	err := w.WriteField("password", password)
	require.NoError(t, err)

	fw, err := w.CreateFormFile("file", "filename")
	require.NoError(t, err)

	_, err = io.Copy(fw, bytes.NewReader(file))
	require.NoError(t, err)

	r := httptest.NewRequest(http.MethodPost, "http://localhost/", &body)
	r.Header.Set("Content-Type", w.FormDataContentType())

	err = w.Close()
	require.NoError(t, err)

	return r
}
