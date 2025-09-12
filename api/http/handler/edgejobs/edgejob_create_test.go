package edgejobs

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/mux"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"

	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

type mockFileService struct {
	mock.Mock
	portainer.FileService
}

func (m *mockFileService) StoreEdgeJobFileFromBytes(id string, file []byte) (string, error) {
	args := m.Called(id, file)
	return args.String(0), args.Error(1)
}

func (m *mockFileService) GetEdgeJobFolder(id string) string {
	args := m.Called(id)

	return args.String(0)
}

func (m *mockFileService) RemoveDirectory(path string) error {
	args := m.Called(path)

	return args.Error(0)
}

func initStore(t *testing.T) *datastore.Store {
	_, store := datastore.MustNewTestStore(t, true, true)
	require.NotNil(t, store)

	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.Endpoint().Create(&portainer.Endpoint{
			ID:          1,
			Name:        "endpoint-1",
			EdgeID:      "edge-id-1",
			GroupID:     1,
			Type:        portainer.EdgeAgentOnDockerEnvironment,
			UserTrusted: true,
		}))

		require.NoError(t, tx.Endpoint().Create(&portainer.Endpoint{
			ID:          2,
			Name:        "endpoint-2",
			EdgeID:      "edge-id-2",
			GroupID:     1,
			Type:        portainer.EdgeAgentOnDockerEnvironment,
			UserTrusted: false,
		}))
		return nil
	}))

	return store
}

func Test_edgeJobCreate_StringMethod_Success(t *testing.T) {
	store := initStore(t)

	fileService := &mockFileService{}
	fileService.On("StoreEdgeJobFileFromBytes", mock.Anything, mock.Anything).Return("testfile.txt", nil)

	handler := &Handler{
		DataStore:   store,
		FileService: fileService,
	}

	payload := edgeJobCreateFromFileContentPayload{
		edgeJobBasePayload: edgeJobBasePayload{
			Name:           "testjob",
			CronExpression: "* * * * *",
			Endpoints:      []portainer.EndpointID{1, 2},
		},
		FileContent: "echo hello",
	}

	body, _ := json.Marshal(payload)
	req := httptest.NewRequest(http.MethodPost, "/edge_jobs/create/string", bytes.NewReader(body))
	req = mux.SetURLVars(req, map[string]string{"method": "string"})
	w := httptest.NewRecorder()

	// Call handler
	errh := handler.edgeJobCreate(w, req)
	require.Nil(t, errh)
	require.Equal(t, http.StatusOK, w.Result().StatusCode)

	// Get edge job ID from response
	var resp struct {
		ID int `json:"Id"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))

	edgeJob, err := store.EdgeJob().Read(portainer.EdgeJobID(resp.ID))
	require.NoError(t, err)

	require.Len(t, edgeJob.Endpoints, 2)
	require.Contains(t, edgeJob.Endpoints, portainer.EndpointID(1))
}

func Test_edgeJobCreate_FileMethod_Success(t *testing.T) {
	store := initStore(t)

	fileService := &mockFileService{}
	fileService.On("StoreEdgeJobFileFromBytes", mock.Anything, mock.Anything).Return("testfile.txt", nil)

	handler := &Handler{
		DataStore:   store,
		FileService: fileService,
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	require.NoError(t, writer.WriteField("Name", "testjob"))
	require.NoError(t, writer.WriteField("CronExpression", "* * * * *"))
	require.NoError(t, writer.WriteField("Endpoints", "[1,2]"))

	fileWriter, err := writer.CreateFormFile("file", "test.txt")
	require.NoError(t, err)

	_, err = io.Copy(fileWriter, strings.NewReader("echo hello"))
	require.NoError(t, err)
	require.NoError(t, writer.Close())

	req := httptest.NewRequest(http.MethodPost, "/edge_jobs/create/file", &body)
	req = mux.SetURLVars(req, map[string]string{"method": "file"})
	req.Header.Set("Content-Type", writer.FormDataContentType())

	w := httptest.NewRecorder()
	handlerErr := handler.edgeJobCreate(w, req)
	require.Nil(t, handlerErr)
	require.Equal(t, http.StatusOK, w.Result().StatusCode)

	var resp struct {
		ID int `json:"Id"`
	}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))

	edgeJob, err := store.EdgeJob().Read(portainer.EdgeJobID(resp.ID))
	require.NoError(t, err)

	require.Len(t, edgeJob.Endpoints, 2)
	require.Contains(t, edgeJob.Endpoints, portainer.EndpointID(1))
}
