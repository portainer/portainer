package docker

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/api/types/swarm"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTransport_updateDefaultGitBranch(t *testing.T) {
	type fields struct {
		gitService portainer.GitService
	}

	type args struct {
		request *http.Request
	}

	commitId := "my-latest-commit-id"
	defaultFields := fields{
		gitService: testhelpers.NewGitService(nil, commitId),
	}

	tests := []struct {
		name          string
		fields        fields
		args          args
		wantErr       bool
		expectedQuery string
	}{
		{
			name:   "append commit ID",
			fields: defaultFields,
			args: args{
				request: httptest.NewRequest(http.MethodPost, "http://unixsocket/build?dockerfile=Dockerfile&remote=https://my-host.com/my-user/my-repo.git&t=my-image", nil),
			},
			wantErr:       false,
			expectedQuery: fmt.Sprintf("dockerfile=Dockerfile&remote=https%%3A%%2F%%2Fmy-host.com%%2Fmy-user%%2Fmy-repo.git%%23%s&t=my-image", commitId),
		},
		{
			name:   "not append commit ID",
			fields: defaultFields,
			args: args{
				request: httptest.NewRequest(http.MethodPost, "http://unixsocket/build?dockerfile=Dockerfile&remote=https://my-host.com/my-user/my-repo/my-file&t=my-image", nil),
			},
			wantErr:       false,
			expectedQuery: "dockerfile=Dockerfile&remote=https://my-host.com/my-user/my-repo/my-file&t=my-image",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			transport := &Transport{
				gitService: tt.fields.gitService,
			}
			err := transport.updateDefaultGitBranch(tt.args.request)
			if (err != nil) != tt.wantErr {
				t.Errorf("updateDefaultGitBranch() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			assert.Equal(t, tt.expectedQuery, tt.args.request.URL.RawQuery)
		})
	}
}

type RoutesDefinition map[[2]string]any

func mockDockerAPIServer(t *testing.T, routes RoutesDefinition) (*httptest.Server, string) {
	version := "1.51"

	v := func(path string) string {
		return "/v" + version + path
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodHead && r.URL.Path == "/_ping" {
			w.Header().Add("Api-Version", version)
			_, _ = w.Write([]byte{})
			return
		}

		for defs, rValue := range routes {
			method, path := defs[0], defs[1]
			if r.Method == method && r.URL.Path == v(path) {
				_ = response.JSON(w, rValue)
				return
			}
		}

		http.NotFound(w, r)
	}))
	require.NotNil(t, srv)

	return srv, version
}

func TestTransport_getRealResourceID(t *testing.T) {
	srv, _ := mockDockerAPIServer(t, RoutesDefinition{
		{http.MethodGet, "/networks"}:           []network.Summary{{ID: "16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4", Name: "mynetwork"}},
		{http.MethodGet, "/networks/mynetwork"}: network.Inspect{ID: "16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4", Name: "mynetwork"},
		{http.MethodGet, "/networks/16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4"}:        network.Inspect{ID: "16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4", Name: "mynetwork"},
		{http.MethodGet, "/containers/mycontainer/json"}:                                                      container.InspectResponse{ContainerJSONBase: &container.ContainerJSONBase{ID: "545fc03ed1fd5008c3bfa2441209ff024e21e396acbeb58b2355930ad1295aa6", Name: "mycontainer"}},
		{http.MethodGet, "/containers/545fc03ed1fd5008c3bfa2441209ff024e21e396acbeb58b2355930ad1295aa6/json"}: container.InspectResponse{ContainerJSONBase: &container.ContainerJSONBase{ID: "545fc03ed1fd5008c3bfa2441209ff024e21e396acbeb58b2355930ad1295aa6", Name: "mycontainer"}},
		{http.MethodGet, "/services/myservice"}:                                                               swarm.Service{ID: "ibt43uf5awhg06bxp8rkd7bhi", Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: "myservice"}}},
		{http.MethodGet, "/services/ibt43uf5awhg06bxp8rkd7bhi"}:                                               swarm.Service{ID: "ibt43uf5awhg06bxp8rkd7bhi", Spec: swarm.ServiceSpec{Annotations: swarm.Annotations{Name: "myservice"}}},
		{http.MethodGet, "/configs/myconfig"}:                                                                 swarm.Config{ID: "3mlqqza0k413ecebk0mfa11em", Spec: swarm.ConfigSpec{Annotations: swarm.Annotations{Name: "myconfig"}}},
		{http.MethodGet, "/configs/3mlqqza0k413ecebk0mfa11em"}:                                                swarm.Config{ID: "3mlqqza0k413ecebk0mfa11em", Spec: swarm.ConfigSpec{Annotations: swarm.Annotations{Name: "myconfig"}}},
		{http.MethodGet, "/secrets/mysecret"}:                                                                 swarm.Secret{ID: "v9i7o4ivg33u4z3jfyxto162d", Spec: swarm.SecretSpec{Annotations: swarm.Annotations{Name: "mysecret"}}},
		{http.MethodGet, "/secrets/v9i7o4ivg33u4z3jfyxto162d"}:                                                swarm.Secret{ID: "v9i7o4ivg33u4z3jfyxto162d", Spec: swarm.SecretSpec{Annotations: swarm.Annotations{Name: "mysecret"}}},
	})
	defer srv.Close()

	transport := &Transport{
		endpoint: &portainer.Endpoint{URL: srv.URL},
	}

	client, err := transport.dockerClientFactory.CreateClient(transport.endpoint, "", nil)
	require.NoError(t, err)
	require.NotNil(t, client)

	test := func(rctype portainer.ResourceControlType, name string, id string, errOnUnknown bool) {
		// by id
		got, err := getRealResourceID(client, rctype, id)
		require.NoError(t, err)
		require.Equal(t, id, got)

		// by name
		got, err = getRealResourceID(client, rctype, name)
		require.NoError(t, err)
		require.Equal(t, id, got)

		// unknown for this type
		_, err = getRealResourceID(client, rctype, "unknown")
		if errOnUnknown {
			require.Error(t, err)
		} else {
			require.NoError(t, err)
		}
	}

	test(portainer.NetworkResourceControl, "mynetwork", "16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4", true)
	test(portainer.ContainerResourceControl, "mycontainer", "545fc03ed1fd5008c3bfa2441209ff024e21e396acbeb58b2355930ad1295aa6", true)
	test(portainer.VolumeResourceControl, "anything", "", false)
	test(portainer.ServiceResourceControl, "myservice", "ibt43uf5awhg06bxp8rkd7bhi", true)
	test(portainer.ConfigResourceControl, "myconfig", "3mlqqza0k413ecebk0mfa11em", true)
	test(portainer.SecretResourceControl, "mysecret", "v9i7o4ivg33u4z3jfyxto162d", true)

	// validate that other types are not supported
	_, err = getRealResourceID(client, portainer.ContainerGroupResourceControl, "")
	require.Error(t, err)
}

func TestTransport_proxyNetworkRequest(t *testing.T) {
	admin := portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	std1 := portainer.User{ID: 2, Username: "std1", Role: portainer.StandardUserRole}
	std2 := portainer.User{ID: 3, Username: "std2", Role: portainer.StandardUserRole}

	_, ds := datastore.MustNewTestStore(t, true, false)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.User().Create(&admin))
		require.NoError(t, tx.User().Create(&std1))
		require.NoError(t, tx.User().Create(&std2))
		require.NoError(t, tx.Endpoint().Create(&portainer.Endpoint{ID: 1, Name: "env",
			UserAccessPolicies: portainer.UserAccessPolicies{std1.ID: portainer.AccessPolicy{RoleID: 1}},
		}))

		require.NoError(t, tx.ResourceControl().Create(authorization.NewPrivateResourceControl("16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4", portainer.NetworkResourceControl, std1.ID)))

		return nil
	}))

	srv, version := mockDockerAPIServer(t, RoutesDefinition{
		{http.MethodGet, "/networks"}:           []network.Summary{{ID: "16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4", Name: "mynetwork"}},
		{http.MethodGet, "/networks/mynetwork"}: network.Inspect{ID: "16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4", Name: "mynetwork"},
		{http.MethodGet, "/networks/16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4"}:             network.Inspect{ID: "16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4", Name: "mynetwork"},
		{http.MethodPost, "/networks/mynetwork/connect"}:                                                           struct{}{},
		{http.MethodPost, "/networks/16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4/connect"}:    struct{}{},
		{http.MethodPost, "/networks/mynetwork/disconnect"}:                                                        struct{}{},
		{http.MethodPost, "/networks/16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4/disconnect"}: struct{}{},
		{http.MethodDelete, "/networks/mynetwork"}:                                                                 struct{}{},
		{http.MethodDelete, "/networks/16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4"}:          struct{}{},
		{http.MethodPost, "/networks/create"}:                                                                      network.CreateResponse{ID: "16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4"},
		{http.MethodPost, "/networks/prune"}:                                                                       struct{}{},
	})
	defer srv.Close()

	transport := &Transport{
		endpoint:      &portainer.Endpoint{URL: srv.URL},
		dataStore:     ds,
		HTTPTransport: &http.Transport{},
	}

	test := func(method string, url string, token portainer.TokenData) (*http.Response, error) {
		req := httptest.NewRequest(method, srv.URL+"/v"+version+url, nil)
		req = req.WithContext(security.StoreTokenData(req, &token))
		require.NotNil(t, req)

		return transport.proxyNetworkRequest(req, url)
	}

	adminToken := portainer.TokenData{ID: admin.ID, Username: admin.Username, Role: admin.Role}
	std1Token := portainer.TokenData{ID: std1.ID, Username: std1.Username, Role: std1.Role}
	std2Token := portainer.TokenData{ID: std2.ID, Username: std2.Username, Role: std2.Role}

	{
		r, err := test(http.MethodGet, "/networks", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		var resp []network.Summary
		require.NoError(t, json.NewDecoder(r.Body).Decode(&resp))
		require.Len(t, resp, 1)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodGet, "/networks", std1Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		var resp []network.Summary
		require.NoError(t, json.NewDecoder(r.Body).Decode(&resp))
		require.Len(t, resp, 1)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodGet, "/networks", std2Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		var resp []network.Summary
		require.NoError(t, json.NewDecoder(r.Body).Decode(&resp))
		require.Empty(t, resp)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodGet, "/networks/mynetwork", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodGet, "/networks/mynetwork", std1Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodGet, "/networks/mynetwork", std2Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodGet, "/networks/unknown", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusNotFound, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/networks/mynetwork/connect", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/networks/mynetwork/connect", std1Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.NoError(t, r.Body.Close())
		require.Equal(t, http.StatusOK, r.StatusCode)
	}

	{
		r, err := test(http.MethodPost, "/networks/mynetwork/connect", std2Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.NoError(t, r.Body.Close())
		require.Equal(t, http.StatusForbidden, r.StatusCode)
	}

	{
		r, err := test(http.MethodPost, "/networks/mynetwork/disconnect", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/networks/mynetwork/disconnect", std1Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/networks/mynetwork/disconnect", std2Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodDelete, "/networks/mynetwork", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodDelete, "/networks/mynetwork", std1Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodDelete, "/networks/mynetwork", std2Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/networks/create", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/networks/create", std1Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/networks/create", std2Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/networks/prune", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/networks/prune", std1Token)
		require.Error(t, err)
		require.Nil(t, r)
		if r != nil {
			r.Body.Close()
		}
	}

	{
		r, err := test(http.MethodPost, "/networks/prune", std2Token)
		require.Error(t, err)
		require.Nil(t, r)
		if r != nil {
			r.Body.Close()
		}
	}
}
