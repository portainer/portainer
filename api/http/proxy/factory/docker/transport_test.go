package docker

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
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

func TestTransport_adminProxy(t *testing.T) {
	t.Parallel()
	admin := portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	std1 := portainer.User{ID: 2, Username: "std1", Role: portainer.StandardUserRole}
	std2 := portainer.User{ID: 3, Username: "std2", Role: portainer.StandardUserRole}

	_, ds := datastore.MustNewTestStore(t, true, false)

	require.NoError(t, ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.User().Create(&admin))
		require.NoError(t, tx.User().Create(&std1))
		require.NoError(t, tx.User().Create(&std2))
		require.NoError(t, tx.Endpoint().Create(&portainer.Endpoint{
			ID: 1, Name: "env",
			UserAccessPolicies: portainer.UserAccessPolicies{std1.ID: portainer.AccessPolicy{RoleID: 1}},
		}))

		return nil
	}))
	srv, version := mockDockerAPIServer(t, RoutesDefinition{
		// allowed routes
		{http.MethodGet, "/plugins"}:            nil,
		{http.MethodGet, "/plugins/xxx/json"}:   nil,
		{http.MethodGet, "/plugins/privileges"}: nil,
		// admin routes ; see `adminOnlyRoutes`
		{http.MethodDelete, "/plugins/xxx"}:              nil,
		{http.MethodPost, "/plugins/sshfs/enable"}:       nil, // simulate plugin "sshfs"
		{http.MethodPost, "/plugins/vieux/sshfs/enable"}: nil, // simulate "vieux/sshfs"
		{http.MethodPost, "/plugins/xxx/disable"}:        nil,
		{http.MethodPost, "/plugins/pull"}:               nil,
		{http.MethodPost, "/plugins/xxx/push"}:           nil,
		{http.MethodPost, "/plugins/xxx/upgrade"}:        nil,
		{http.MethodPost, "/plugins/xxx/set"}:            nil,
		{http.MethodPost, "/plugins/create"}:             nil,
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

		return transport.ProxyDockerRequest(req)
	}

	adminToken := portainer.TokenData{ID: admin.ID, Username: admin.Username, Role: admin.Role}
	std1Token := portainer.TokenData{ID: std1.ID, Username: std1.Username, Role: std1.Role}
	std2Token := portainer.TokenData{ID: std2.ID, Username: std2.Username, Role: std2.Role}

	{
		r, err := test(http.MethodGet, "/plugins", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodGet, "/plugins", std1Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodGet, "/plugins", std2Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/plugins/pull", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/plugins/pull", std1Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/plugins/pull", std2Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/plugins/sshfs/enable", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/plugins/sshfs/enable", std2Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/plugins/vieux/sshfs/enable", adminToken)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusOK, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}

	{
		r, err := test(http.MethodPost, "/plugins/vieux/sshfs/enable", std2Token)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode)
		require.NoError(t, r.Body.Close())
	}
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
		got, err := getDockerResourceUUID(client, rctype, id)
		require.NoError(t, err)
		require.Equal(t, id, got)

		// by name
		got, err = getDockerResourceUUID(client, rctype, name)
		require.NoError(t, err)
		require.Equal(t, id, got)

		// unknown for this type
		_, err = getDockerResourceUUID(client, rctype, "unknown")
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
	_, err = getDockerResourceUUID(client, portainer.ContainerGroupResourceControl, "")
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
		require.NoError(t, tx.Endpoint().Create(&portainer.Endpoint{
			ID: 1, Name: "env",
			UserAccessPolicies: portainer.UserAccessPolicies{std1.ID: portainer.AccessPolicy{RoleID: 1}},
		}))

		require.NoError(t, tx.ResourceControl().Create(authorization.NewPrivateResourceControl("16e37c629e88694663791dc738fd37affb908d7b85ce00a20680675d10554fd4", portainer.NetworkResourceControl, std1.ID)))
		require.NoError(t, tx.ResourceControl().Create(authorization.NewPrivateResourceControl("mycontainerid", portainer.ContainerResourceControl, std1.ID)))

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
		{http.MethodGet, "/containers/mycontainer/json"}:                                                           container.InspectResponse{ContainerJSONBase: &container.ContainerJSONBase{ID: "mycontainerid", Name: "mycontainer"}},
	})
	defer srv.Close()

	transport := &Transport{
		endpoint:      &portainer.Endpoint{URL: srv.URL},
		dataStore:     ds,
		HTTPTransport: &http.Transport{},
	}

	test := func(method string, url string, token portainer.TokenData) (*http.Response, error) {
		req := httptest.NewRequest(method, srv.URL+"/v"+version+url, strings.NewReader(`{"Container":"mycontainer"}`))
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
			err = r.Body.Close()
			require.NoError(t, err)
		}
	}

	{
		r, err := test(http.MethodPost, "/networks/prune", std2Token)
		require.Error(t, err)
		require.Nil(t, r)
		if r != nil {
			require.NoError(t, r.Body.Close())
		}
	}
}

func TestTransport_ProxyDockerRequest_rejectsEncodedSeparator(t *testing.T) {
	t.Parallel()

	srv, version := mockDockerAPIServer(t, RoutesDefinition{
		{http.MethodGet, "/images/alpine/get"}: nil,
	})
	defer srv.Close()

	transport := &Transport{
		endpoint:      &portainer.Endpoint{URL: srv.URL},
		dataStore:     nil,
		HTTPTransport: &http.Transport{},
	}

	proxy := func(url string) (*http.Response, error) {
		req := httptest.NewRequest(http.MethodGet, srv.URL+"/v"+version+url, nil)
		require.NotNil(t, req)

		return transport.ProxyDockerRequest(req)
	}

	// encoded slash path is rejected.
	for _, encoded := range []string{
		"/images%2falpine%2fget",
		"/images%2Falpine%2Fget",
		"/exec%2fabc123%2fstart",
		"/images%5calpine%5cget",
	} {
		r, err := proxy(encoded)
		require.NoError(t, err)
		require.NotNil(t, r)
		require.Equal(t, http.StatusForbidden, r.StatusCode, "expected %q to be rejected", encoded)
		require.NoError(t, r.Body.Close())
	}

	// Literal slash path passes the guard and reaches the daemon.
	r, err := proxy("/images/alpine/get")
	require.NoError(t, err)
	require.NotNil(t, r)
	require.Equal(t, http.StatusOK, r.StatusCode)
	require.NoError(t, r.Body.Close())
}

func TestTransport_proxyBuildRequest_NetworkMode(t *testing.T) {
	t.Parallel()

	admin := portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	std := portainer.User{ID: 2, Username: "std", Role: portainer.StandardUserRole}

	_, ds := datastore.MustNewTestStore(t, true, false)

	err := ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		if err := tx.User().Create(&admin); err != nil {
			return err
		}

		if err := tx.User().Create(&std); err != nil {
			return err
		}

		if err := tx.Endpoint().Create(&portainer.Endpoint{ID: 1, Name: "env"}); err != nil {
			return err
		}

		return tx.ResourceControl().Create(authorization.NewPrivateResourceControl("ownernetid", portainer.NetworkResourceControl, admin.ID))
	})
	require.NoError(t, err)

	srv, version := mockDockerAPIServer(t, RoutesDefinition{
		{http.MethodPost, "/build"}:              map[string]any{},
		{http.MethodGet, "/networks/ownernet"}:   network.Inspect{ID: "ownernetid", Name: "ownernet"},
		{http.MethodGet, "/networks/ownernetid"}: network.Inspect{ID: "ownernetid", Name: "ownernet"},
		{http.MethodGet, "/networks/hostid"}:     network.Inspect{ID: "hostid", Name: "host"},
	})
	t.Cleanup(srv.Close)

	transport := &Transport{
		endpoint:      &portainer.Endpoint{ID: 1, URL: srv.URL},
		dataStore:     ds,
		HTTPTransport: &http.Transport{},
	}

	f := func(user portainer.User, query string, contentType string, body string, wantStatus int) {
		t.Helper()

		req := httptest.NewRequest(http.MethodPost, srv.URL+"/v"+version+"/build"+query, strings.NewReader(body))
		if contentType != "" {
			req.Header.Set("Content-Type", contentType)
		}
		req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: user.ID, Username: user.Username, Role: user.Role}))

		resp, err := transport.proxyBuildRequest(req, "/build")
		require.NoError(t, err)
		require.Equal(t, wantStatus, resp.StatusCode)
		require.NoError(t, resp.Body.Close())
	}

	// a build without networkmode needs no authorization
	f(std, "", "", "FROM scratch", http.StatusOK)

	// building on Docker's built-in host network needs no authorization
	f(std, "?networkmode=host", "", "FROM scratch", http.StatusOK)

	// referencing Docker's built-in host network by ID needs no authorization either
	f(std, "?networkmode=hostid", "", "FROM scratch", http.StatusOK)

	// building on a network privately owned by another user is forbidden
	f(std, "?networkmode=ownernet", "", "FROM scratch", http.StatusForbidden)

	// referencing that network by ID is forbidden too
	f(std, "?networkmode=ownernetid", "", "FROM scratch", http.StatusForbidden)

	// smuggling networkmode through a form encoded body, which the daemon also reads, is forbidden
	f(std, "", "application/x-www-form-urlencoded", "networkmode=ownernet", http.StatusForbidden)

	// a repeated networkmode cannot hide a forbidden value behind an allowed one
	f(std, "?networkmode=host&networkmode=ownernet", "", "FROM scratch", http.StatusForbidden)

	// administrators may build on any network
	f(admin, "?networkmode=ownernet", "", "FROM scratch", http.StatusOK)
}

func TestTransport_proxyNetworkRequest_ConnectionContainer(t *testing.T) {
	t.Parallel()

	admin := portainer.User{ID: 1, Username: "admin", Role: portainer.AdministratorRole}
	attacker := portainer.User{ID: 2, Username: "attacker", Role: portainer.StandardUserRole}
	victim := portainer.User{ID: 3, Username: "victim", Role: portainer.StandardUserRole}

	_, ds := datastore.MustNewTestStore(t, true, false)

	err := ds.UpdateTx(func(tx dataservices.DataStoreTx) error {
		for _, user := range []*portainer.User{&admin, &attacker, &victim} {
			if err := tx.User().Create(user); err != nil {
				return err
			}
		}

		if err := tx.Endpoint().Create(&portainer.Endpoint{ID: 1, Name: "env"}); err != nil {
			return err
		}

		for _, rc := range []*portainer.ResourceControl{
			authorization.NewPrivateResourceControl("attackernetid", portainer.NetworkResourceControl, attacker.ID),
			authorization.NewPrivateResourceControl("victimnetid", portainer.NetworkResourceControl, victim.ID),
			authorization.NewPrivateResourceControl("attackerctrid", portainer.ContainerResourceControl, attacker.ID),
			authorization.NewPrivateResourceControl("victimctrid", portainer.ContainerResourceControl, victim.ID),
		} {
			if err := tx.ResourceControl().Create(rc); err != nil {
				return err
			}
		}

		return nil
	})
	require.NoError(t, err)

	routes := RoutesDefinition{}
	for _, name := range []string{"attackernet", "victimnet"} {
		routes[[2]string{http.MethodGet, "/networks/" + name}] = network.Inspect{ID: name + "id", Name: name}
		routes[[2]string{http.MethodPost, "/networks/" + name + "/connect"}] = struct{}{}
		routes[[2]string{http.MethodPost, "/networks/" + name + "/disconnect"}] = struct{}{}
	}

	for _, name := range []string{"attackerctr", "victimctr", "orphanctr"} {
		inspect := container.InspectResponse{ContainerJSONBase: &container.ContainerJSONBase{ID: name + "id", Name: name}, Config: &container.Config{}}
		routes[[2]string{http.MethodGet, "/containers/" + name + "/json"}] = inspect
		routes[[2]string{http.MethodGet, "/containers/" + name + "id/json"}] = inspect
	}

	srv, version := mockDockerAPIServer(t, routes)
	t.Cleanup(srv.Close)

	transport := &Transport{
		endpoint:      &portainer.Endpoint{ID: 1, URL: srv.URL},
		dataStore:     ds,
		HTTPTransport: &http.Transport{},
	}

	f := func(user portainer.User, action string, networkName string, body string, wantStatus int) {
		t.Helper()

		url := "/networks/" + networkName + "/" + action
		req := httptest.NewRequest(http.MethodPost, srv.URL+"/v"+version+url, strings.NewReader(body))
		req = req.WithContext(security.StoreTokenData(req, &portainer.TokenData{ID: user.ID, Username: user.Username, Role: user.Role}))

		resp, err := transport.proxyNetworkRequest(req, url)
		require.NoError(t, err)
		require.Equal(t, wantStatus, resp.StatusCode)
		require.NoError(t, resp.Body.Close())
	}

	// connecting an owned container to an owned network is allowed
	f(attacker, "connect", "attackernet", `{"Container":"attackerctr"}`, http.StatusOK)

	// disconnecting an owned container from an owned network is allowed
	f(attacker, "disconnect", "attackernet", `{"Container":"attackerctr"}`, http.StatusOK)

	// connecting an owned container to another user's network is forbidden
	f(attacker, "connect", "victimnet", `{"Container":"attackerctr"}`, http.StatusForbidden)

	// pulling another user's container into an owned network is forbidden
	f(attacker, "connect", "attackernet", `{"Container":"victimctr"}`, http.StatusForbidden)

	// referencing that container by ID is forbidden too
	f(attacker, "connect", "attackernet", `{"Container":"victimctrid"}`, http.StatusForbidden)

	// a lowercase key, which the daemon also accepts, is forbidden too
	f(attacker, "connect", "attackernet", `{"container":"victimctr"}`, http.StatusForbidden)

	// a duplicated key, where the daemon uses the last value, is forbidden too
	f(attacker, "connect", "attackernet", `{"Container":"attackerctr","Container":"victimctr"}`, http.StatusForbidden)

	// connecting a container with no resource control at all is forbidden
	f(attacker, "connect", "attackernet", `{"Container":"orphanctr"}`, http.StatusForbidden)

	// disconnecting another user's container from an owned network is forbidden
	f(attacker, "disconnect", "attackernet", `{"Container":"victimctr","Force":true}`, http.StatusForbidden)

	// administrators may connect any container to any network
	f(admin, "connect", "victimnet", `{"Container":"attackerctr"}`, http.StatusOK)
}
