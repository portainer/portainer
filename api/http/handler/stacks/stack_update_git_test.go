package stacks

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/datastore"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"

	"github.com/google/uuid"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/require"
)

func TestStackUpdateGitWebhookUniqueness(t *testing.T) {
	t.Parallel()
	webhook, err := uuid.NewRandom()
	require.NoError(t, err)

	_, store := datastore.MustNewTestStore(t, false, false)

	endpoint := &portainer.Endpoint{
		ID:   123,
		Name: "endpoint1",
		Type: portainer.DockerEnvironment,
	}
	err = store.Endpoint().Create(endpoint)
	require.NoError(t, err)

	const stack1ID = portainer.StackID(456)
	const stack2ID = portainer.StackID(457)

	sharedSrc := &portainer.Source{
		Type: portainer.SourceTypeGit,
		Git:  &gittypes.RepoConfig{URL: "https://github.com/portainer/portainer.git"},
	}
	err = store.Source().Create(source.InsecureNewAdminContext(), sharedSrc)
	require.NoError(t, err)

	wf1 := &portainer.Workflow{Artifacts: []portainer.Artifact{{
		StackID: stack1ID,
		Files:   []portainer.ArtifactFile{{SourceID: sharedSrc.ID}},
	}}}
	err = store.Workflow().Create(wf1)
	require.NoError(t, err)

	wf2 := &portainer.Workflow{Artifacts: []portainer.Artifact{{
		StackID: stack2ID,
		Files:   []portainer.ArtifactFile{{SourceID: sharedSrc.ID}},
	}}}
	err = store.Workflow().Create(wf2)
	require.NoError(t, err)

	stack1 := portainer.Stack{
		ID:         stack1ID,
		EndpointID: endpoint.ID,
		WorkflowID: wf1.ID,
		AutoUpdate: &portainer.AutoUpdateSettings{
			Webhook: webhook.String(),
		},
	}

	err = store.Stack().Create(&stack1)
	require.NoError(t, err)

	stack2 := stack1
	stack2.ID = stack2ID
	stack2.AutoUpdate = nil
	stack2.WorkflowID = wf2.ID

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

	rrc := &security.RestrictedRequestContext{
		IsAdmin: true,
		UserID:  1,
		User:    &portainer.User{ID: 1, Role: portainer.AdministratorRole},
	}
	req = req.WithContext(security.StoreRestrictedRequestContext(req, rrc))

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	require.Equal(t, http.StatusConflict, rr.Code)
}
