package stacks

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/gofrs/uuid"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestStackUpdateGitWebhookUniqueness(t *testing.T) {
	webhook, err := uuid.NewV4()
	require.NoError(t, err)

	_, store := datastore.MustNewTestStore(t, false, false)

	endpoint := &portainer.Endpoint{
		ID:   123,
		Name: "endpoint1",
		Type: portainer.DockerEnvironment,
	}
	err = store.Endpoint().Create(endpoint)
	require.NoError(t, err)

	stack1 := portainer.Stack{
		ID:         456,
		EndpointID: endpoint.ID,
		AutoUpdate: &portainer.AutoUpdateSettings{
			Webhook: webhook.String(),
		},
		GitConfig: &gittypes.RepoConfig{
			URL: "https://github.com/portainer/portainer.git",
		},
	}

	err = store.Stack().Create(&stack1)
	require.NoError(t, err)

	stack2 := stack1
	stack2.ID++
	stack2.AutoUpdate = nil

	err = store.Stack().Create(&stack2)
	require.NoError(t, err)

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	payload := &stackGitUpdatePayload{
		AutoUpdate: &portainer.AutoUpdateSettings{
			Webhook: webhook.String(),
		},
	}

	jsonPayload, err := json.Marshal(payload)
	require.NoError(t, err)

	url := "/stacks/" + strconv.Itoa(int(stack2.ID)) + "/git?endpointId=" + strconv.Itoa(int(endpoint.ID))
	req := httptest.NewRequest(http.MethodPost, url, bytes.NewReader(jsonPayload))

	rrc := &security.RestrictedRequestContext{}
	req = req.WithContext(security.StoreRestrictedRequestContext(req, rrc))

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	require.Equal(t, http.StatusConflict, rr.Code)
}
