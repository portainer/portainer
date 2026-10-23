package endpoints

import (
	"net/http"
	"net/url"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/roar"
	"github.com/portainer/portainer/api/slicesx"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type filterTest struct {
	title    string
	expected []portainer.EndpointID
	query    EnvironmentsQuery
}

func Test_Filter_AgentVersion(t *testing.T) {
	t.Parallel()
	version1Endpoint := portainer.Endpoint{ID: 1, GroupID: 1,
		Type:  portainer.AgentOnDockerEnvironment,
		Agent: portainer.EnvironmentAgentData{Version: "1.0.0"}}
	version2Endpoint := portainer.Endpoint{ID: 2, GroupID: 1,
		Type:  portainer.AgentOnDockerEnvironment,
		Agent: portainer.EnvironmentAgentData{Version: "2.0.0"}}
	noVersionEndpoint := portainer.Endpoint{ID: 3, GroupID: 1,
		Type: portainer.AgentOnDockerEnvironment,
	}
	notAgentEnvironments := portainer.Endpoint{ID: 4, Type: portainer.DockerEnvironment, GroupID: 1}

	endpoints := []portainer.Endpoint{
		version1Endpoint,
		version2Endpoint,
		noVersionEndpoint,
		notAgentEnvironments,
	}

	handler := setupFilterTest(t, endpoints)

	tests := []filterTest{
		{
			"should show version 1 endpoints",
			[]portainer.EndpointID{version1Endpoint.ID},
			EnvironmentsQuery{
				agentVersions: []string{version1Endpoint.Agent.Version},
				types:         []portainer.EndpointType{portainer.AgentOnDockerEnvironment},
			},
		},
		{
			"should show version 2 endpoints",
			[]portainer.EndpointID{version2Endpoint.ID},
			EnvironmentsQuery{
				agentVersions: []string{version2Endpoint.Agent.Version},
				types:         []portainer.EndpointType{portainer.AgentOnDockerEnvironment},
			},
		},
		{
			"should show version 1 and 2 endpoints",
			[]portainer.EndpointID{version2Endpoint.ID, version1Endpoint.ID},
			EnvironmentsQuery{
				agentVersions: []string{version2Endpoint.Agent.Version, version1Endpoint.Agent.Version},
				types:         []portainer.EndpointType{portainer.AgentOnDockerEnvironment},
			},
		},
	}

	runTests(tests, t, handler, endpoints)
}

func Test_Filter_edgeFilter(t *testing.T) {
	t.Parallel()
	trustedEdgeAsync := portainer.Endpoint{ID: 1, UserTrusted: true, Edge: portainer.EnvironmentEdgeSettings{AsyncMode: true}, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	untrustedEdgeAsync := portainer.Endpoint{ID: 2, UserTrusted: false, Edge: portainer.EnvironmentEdgeSettings{AsyncMode: true}, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	regularUntrustedEdgeStandard := portainer.Endpoint{ID: 3, UserTrusted: false, Edge: portainer.EnvironmentEdgeSettings{AsyncMode: false}, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	regularTrustedEdgeStandard := portainer.Endpoint{ID: 4, UserTrusted: true, Edge: portainer.EnvironmentEdgeSettings{AsyncMode: false}, GroupID: 1, Type: portainer.EdgeAgentOnDockerEnvironment}
	regularEndpoint := portainer.Endpoint{ID: 5, GroupID: 1, Type: portainer.DockerEnvironment}

	endpoints := []portainer.Endpoint{
		trustedEdgeAsync,
		untrustedEdgeAsync,
		regularUntrustedEdgeStandard,
		regularTrustedEdgeStandard,
		regularEndpoint,
	}

	handler := setupFilterTest(t, endpoints)

	tests := []filterTest{
		{
			"should show all edge endpoints except of the untrusted edge",
			[]portainer.EndpointID{trustedEdgeAsync.ID, regularTrustedEdgeStandard.ID},
			EnvironmentsQuery{
				types: []portainer.EndpointType{portainer.EdgeAgentOnDockerEnvironment, portainer.EdgeAgentOnKubernetesEnvironment},
			},
		},
		{
			"should show only trusted edge devices and other regular endpoints",
			[]portainer.EndpointID{trustedEdgeAsync.ID, regularEndpoint.ID},
			EnvironmentsQuery{
				edgeAsync: new(true),
			},
		},
		{
			"should show only untrusted edge devices and other regular endpoints",
			[]portainer.EndpointID{untrustedEdgeAsync.ID, regularEndpoint.ID},
			EnvironmentsQuery{
				edgeAsync:           new(true),
				edgeDeviceUntrusted: true,
			},
		},
		{
			"should show no edge devices",
			[]portainer.EndpointID{regularEndpoint.ID, regularTrustedEdgeStandard.ID},
			EnvironmentsQuery{
				edgeAsync: new(false),
			},
		},
	}

	runTests(tests, t, handler, endpoints)
}

func Test_Filter_excludeIDs(t *testing.T) {
	t.Parallel()
	ids := []portainer.EndpointID{1, 2, 3, 4, 5, 6, 7, 8, 9}

	environments := slicesx.Map(ids, func(id portainer.EndpointID) portainer.Endpoint {
		return portainer.Endpoint{ID: id, GroupID: 1, Type: portainer.DockerEnvironment}
	})

	handler := setupFilterTest(t, environments)

	tests := []filterTest{
		{
			title:    "should exclude IDs 2,5,8",
			expected: []portainer.EndpointID{1, 3, 4, 6, 7, 9},
			query: EnvironmentsQuery{
				excludeIds: []portainer.EndpointID{2, 5, 8},
			},
		},
	}

	runTests(tests, t, handler, environments)
}

func Test_Filter_excludeGroupIDs(t *testing.T) {
	t.Parallel()
	groupA := portainer.EndpointGroupID(10)
	groupB := portainer.EndpointGroupID(20)
	groupC := portainer.EndpointGroupID(30)

	endpoints := []portainer.Endpoint{
		{ID: 1, GroupID: groupA, Type: portainer.DockerEnvironment},
		{ID: 2, GroupID: groupA, Type: portainer.DockerEnvironment},
		{ID: 3, GroupID: groupB, Type: portainer.DockerEnvironment},
		{ID: 4, GroupID: groupB, Type: portainer.DockerEnvironment},
		{ID: 5, GroupID: groupC, Type: portainer.DockerEnvironment},
	}

	handler := setupFilterTest(t, endpoints)

	tests := []filterTest{
		{
			title:    "should exclude endpoints in groupA",
			expected: []portainer.EndpointID{3, 4, 5},
			query: EnvironmentsQuery{
				excludeGroupIds: []portainer.EndpointGroupID{groupA},
			},
		},
		{
			title:    "should exclude endpoints in groupA and groupB",
			expected: []portainer.EndpointID{5},
			query: EnvironmentsQuery{
				excludeGroupIds: []portainer.EndpointGroupID{groupA, groupB},
			},
		},
		{
			title:    "should return all endpoints when excludeGroupIds is empty",
			expected: []portainer.EndpointID{1, 2, 3, 4, 5},
			query:    EnvironmentsQuery{},
		},
	}

	runTests(tests, t, handler, endpoints)
}

func BenchmarkFilterEndpointsBySearchCriteria_PartialMatch(b *testing.B) {
	n := 10000

	endpointIDs := []portainer.EndpointID{}

	endpoints := []portainer.Endpoint{}
	for i := range n {
		endpoints = append(endpoints, portainer.Endpoint{
			ID:      portainer.EndpointID(i + 1),
			Name:    "endpoint-" + strconv.Itoa(i+1),
			GroupID: 1,
			TagIDs:  []portainer.TagID{1},
			Type:    portainer.EdgeAgentOnDockerEnvironment,
		})

		endpointIDs = append(endpointIDs, portainer.EndpointID(i+1))
	}

	endpointGroups := []portainer.EndpointGroup{}

	edgeGroups := []portainer.EdgeGroup{}
	for i := range 1000 {
		edgeGroups = append(edgeGroups, portainer.EdgeGroup{
			ID:           portainer.EdgeGroupID(i + 1),
			Name:         "edge-group-" + strconv.Itoa(i+1),
			EndpointIDs:  roar.FromSlice(endpointIDs),
			Dynamic:      true,
			TagIDs:       []portainer.TagID{1, 2, 3},
			PartialMatch: true,
		})
	}

	tagsMap := map[portainer.TagID]string{}
	for i := range 10 {
		tagsMap[portainer.TagID(i+1)] = "tag-" + strconv.Itoa(i+1)
	}

	searchString := "edge-group"

	for b.Loop() {
		e := filterEndpointsBySearchCriteria(endpoints, endpointGroups, edgeGroups, tagsMap, searchString)
		if len(e) != n {
			b.FailNow()
		}
	}
}

func BenchmarkFilterEndpointsBySearchCriteria_FullMatch(b *testing.B) {
	n := 10000

	endpointIDs := []portainer.EndpointID{}

	endpoints := []portainer.Endpoint{}
	for i := range n {
		endpoints = append(endpoints, portainer.Endpoint{
			ID:      portainer.EndpointID(i + 1),
			Name:    "endpoint-" + strconv.Itoa(i+1),
			GroupID: 1,
			TagIDs:  []portainer.TagID{1, 2, 3},
			Type:    portainer.EdgeAgentOnDockerEnvironment,
		})

		endpointIDs = append(endpointIDs, portainer.EndpointID(i+1))
	}

	endpointGroups := []portainer.EndpointGroup{}

	edgeGroups := []portainer.EdgeGroup{}
	for i := range 1000 {
		edgeGroups = append(edgeGroups, portainer.EdgeGroup{
			ID:          portainer.EdgeGroupID(i + 1),
			Name:        "edge-group-" + strconv.Itoa(i+1),
			EndpointIDs: roar.FromSlice(endpointIDs),
			Dynamic:     true,
			TagIDs:      []portainer.TagID{1},
		})
	}

	tagsMap := map[portainer.TagID]string{}
	for i := range 10 {
		tagsMap[portainer.TagID(i+1)] = "tag-" + strconv.Itoa(i+1)
	}

	searchString := "edge-group"

	for b.Loop() {
		e := filterEndpointsBySearchCriteria(endpoints, endpointGroups, edgeGroups, tagsMap, searchString)
		require.Len(b, e, n)
	}
}

func runTests(tests []filterTest, t *testing.T, handler *Handler, endpoints []portainer.Endpoint) {
	for _, test := range tests {
		t.Run(test.title, func(t *testing.T) {
			runTest(t, test, handler, append([]portainer.Endpoint{}, endpoints...))
		})
	}
}

func runTest(t *testing.T, test filterTest, handler *Handler, endpoints []portainer.Endpoint) {
	is := assert.New(t)

	filteredEndpoints, _, err := handler.filterEndpointsByQuery(
		endpoints,
		test.query,
		[]portainer.EndpointGroup{},
		[]portainer.EdgeGroup{},
		&portainer.Settings{},
		&security.RestrictedRequestContext{IsAdmin: true},
	)

	require.NoError(t, err)

	is.Len(filteredEndpoints, len(test.expected))

	respIds := []portainer.EndpointID{}

	for _, endpoint := range filteredEndpoints {
		respIds = append(respIds, endpoint.ID)
	}

	is.ElementsMatch(test.expected, respIds)
}

func setupFilterTest(t *testing.T, endpoints []portainer.Endpoint) *Handler {
	_, store := datastore.MustNewTestStore(t, true, true)

	for _, endpoint := range endpoints {
		err := store.Endpoint().Create(&endpoint)
		require.NoError(t, err, "error creating environment")
	}

	err := store.User().Create(&portainer.User{Username: "admin", Role: portainer.AdministratorRole})
	require.NoError(t, err, "error creating a user")

	bouncer := testhelpers.NewTestRequestBouncer()
	handler := NewHandler(bouncer)
	handler.DataStore = store
	handler.ComposeStackManager = testhelpers.NewComposeStackManager()

	return handler
}

func TestFilterEndpointsByEdgeStack(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	endpoints := []portainer.Endpoint{
		{ID: 1, Name: "Endpoint 1", Type: portainer.EdgeAgentOnDockerEnvironment, UserTrusted: true},
		{ID: 2, Name: "Endpoint 2", TagIDs: []portainer.TagID{1}, Type: portainer.EdgeAgentOnDockerEnvironment, UserTrusted: true},
		{ID: 3, Name: "Endpoint 3", TagIDs: []portainer.TagID{1}, Type: portainer.EdgeAgentOnDockerEnvironment, UserTrusted: true},
		{ID: 4, Name: "Endpoint 4"},
	}

	edgeStackId := portainer.EdgeStackID(1)
	require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
		require.NoError(t, tx.Tag().Create(&portainer.Tag{ID: 1, Name: "tag", Endpoints: map[portainer.EndpointID]bool{2: true, 3: true}}))

		for i := range endpoints {
			require.NoError(t, tx.Endpoint().Create(&endpoints[i]))
		}

		require.NoError(t, tx.EdgeStack().Create(edgeStackId, &portainer.EdgeStack{
			ID:         edgeStackId,
			Name:       "Test Edge Stack",
			EdgeGroups: []portainer.EdgeGroupID{1, 2},
		}))

		require.NoError(t, tx.EdgeGroup().Create(&portainer.EdgeGroup{
			ID:          1,
			Name:        "Edge Group 1",
			EndpointIDs: roar.FromSlice([]portainer.EndpointID{1}),
		}))

		require.NoError(t, tx.EdgeGroup().Create(&portainer.EdgeGroup{
			ID:      2,
			Name:    "Edge Group 2",
			Dynamic: true,
			TagIDs:  []portainer.TagID{1},
		}))

		require.NoError(t, tx.EdgeStackStatus().Create(edgeStackId, endpoints[0].ID, &portainer.EdgeStackStatusForEnv{
			Status: []portainer.EdgeStackDeploymentStatus{{Type: portainer.EdgeStackStatusAcknowledged}}}))

		return nil
	}))

	test := func(status *portainer.EdgeStackStatusType, expected []portainer.Endpoint) {
		tmp := make([]portainer.Endpoint, len(endpoints))
		require.Equal(t, 4, copy(tmp, endpoints))
		es, err := filterEndpointsByEdgeStack(tmp, edgeStackId, status, store)
		require.NoError(t, err)
		// validate that the len is the same
		require.Len(t, es, len(expected))
		// and that all items are the expected ones
		for i := range expected {
			require.Contains(t, es, expected[i])
		}
	}

	test(nil, []portainer.Endpoint{endpoints[0], endpoints[1], endpoints[2]})

	status := portainer.EdgeStackStatusPending
	test(&status, []portainer.Endpoint{endpoints[1], endpoints[2]})

	status = portainer.EdgeStackStatusCompleted
	test(&status, []portainer.Endpoint{})

	status = portainer.EdgeStackStatusAcknowledged
	test(&status, []portainer.Endpoint{endpoints[0]}) // that's the only one with an edge stack status in DB
}

func TestErrorsFilterEndpointsByEdgeStack(t *testing.T) {
	t.Parallel()
	t.Run("must error by edge stack not found", func(t *testing.T) {
		_, store := datastore.MustNewTestStore(t, false, false)
		require.NotNil(t, store)

		_, err := filterEndpointsByEdgeStack([]portainer.Endpoint{}, 1, nil, store)
		require.Error(t, err)
	})

	t.Run("must error by edge group not found", func(t *testing.T) {
		_, store := datastore.MustNewTestStore(t, false, false)
		require.NotNil(t, store)

		require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			require.NoError(t, tx.EdgeStack().Create(1, &portainer.EdgeStack{ID: 1, Name: "1", EdgeGroups: []portainer.EdgeGroupID{1}}))
			return nil
		}))
		_, err := filterEndpointsByEdgeStack([]portainer.Endpoint{}, 1, nil, store)
		require.Error(t, err)
	})

	t.Run("must error by env tag not found", func(t *testing.T) {
		_, store := datastore.MustNewTestStore(t, false, false)
		require.NotNil(t, store)

		require.NoError(t, store.UpdateTx(func(tx dataservices.DataStoreTx) error {
			require.NoError(t, tx.EdgeStack().Create(1, &portainer.EdgeStack{ID: 1, Name: "1", EdgeGroups: []portainer.EdgeGroupID{1}}))
			require.NoError(t, tx.EdgeGroup().Create(&portainer.EdgeGroup{ID: 1, Name: "edge group", Dynamic: true, TagIDs: []portainer.TagID{1}}))
			return nil
		}))
		_, err := filterEndpointsByEdgeStack([]portainer.Endpoint{}, 1, nil, store)
		require.Error(t, err)
	})
}

func TestFilterEndpointsByEdgeGroup(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	endpoints := []portainer.Endpoint{
		{ID: 1, Name: "Endpoint 1"},
		{ID: 2, Name: "Endpoint 2"},
		{ID: 3, Name: "Endpoint 3"},
		{ID: 4, Name: "Endpoint 4"},
	}

	err := store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:          1,
		Name:        "Edge Group 1",
		EndpointIDs: roar.FromSlice([]portainer.EndpointID{1}),
	})
	require.NoError(t, err)

	err = store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:          2,
		Name:        "Edge Group 2",
		EndpointIDs: roar.FromSlice([]portainer.EndpointID{2, 3}),
	})
	require.NoError(t, err)

	edgeGroups, err := store.EdgeGroup().ReadAll()
	require.NoError(t, err)

	es, egs := filterEndpointsByEdgeGroupIDs(endpoints, edgeGroups, []portainer.EdgeGroupID{1, 2})
	require.NoError(t, err)

	require.Len(t, es, 3)
	require.Contains(t, es, endpoints[0])    // Endpoint 1
	require.Contains(t, es, endpoints[1])    // Endpoint 2
	require.Contains(t, es, endpoints[2])    // Endpoint 3
	require.NotContains(t, es, endpoints[3]) // Endpoint 4

	require.Len(t, egs, 2)
	require.Equal(t, egs[0].ID, portainer.EdgeGroupID(1))
	require.Equal(t, egs[1].ID, portainer.EdgeGroupID(2))
}

func TestFilterEndpointsByExcludeEdgeGroupIDs(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, false, false)

	endpoints := []portainer.Endpoint{
		{ID: 1, Name: "Endpoint 1"},
		{ID: 2, Name: "Endpoint 2"},
		{ID: 3, Name: "Endpoint 3"},
		{ID: 4, Name: "Endpoint 4"},
	}

	err := store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:          1,
		Name:        "Edge Group 1",
		EndpointIDs: roar.FromSlice([]portainer.EndpointID{1}),
	})
	require.NoError(t, err)

	err = store.EdgeGroup().Create(&portainer.EdgeGroup{
		ID:          2,
		Name:        "Edge Group 2",
		EndpointIDs: roar.FromSlice([]portainer.EndpointID{2, 3}),
	})
	require.NoError(t, err)

	edgeGroups, err := store.EdgeGroup().ReadAll()
	require.NoError(t, err)

	es, egs := filterEndpointsByExcludeEdgeGroupIDs(endpoints, edgeGroups, []portainer.EdgeGroupID{1})
	require.NoError(t, err)

	require.Len(t, es, 3)
	require.Equal(t, []portainer.Endpoint{
		{ID: 2, Name: "Endpoint 2"},
		{ID: 3, Name: "Endpoint 3"},
		{ID: 4, Name: "Endpoint 4"},
	}, es)

	require.Len(t, egs, 1)
	require.Equal(t, egs[0].ID, portainer.EdgeGroupID(2))
}

func TestGetShortestAsyncInterval(t *testing.T) {
	t.Parallel()
	endpoint := &portainer.Endpoint{
		ID:   1,
		Name: "Test Endpoint",
		Edge: portainer.EnvironmentEdgeSettings{
			PingInterval:     -1,
			SnapshotInterval: -1,
			CommandInterval:  -1,
		},
	}

	settings := &portainer.Settings{
		Edge: portainer.Edge{
			PingInterval:     10,
			SnapshotInterval: 20,
			CommandInterval:  30,
		},
	}

	require.Equal(t, 10, getShortestAsyncInterval(endpoint, settings))
}

func Test_filterEndpointsByPlatform(t *testing.T) {
	ep := func(id portainer.EndpointID, epType portainer.EndpointType, containerEngine string) portainer.Endpoint {
		return portainer.Endpoint{
			ID:              id,
			Type:            epType,
			ContainerEngine: containerEngine,
		}
	}

	docker := ep(1, portainer.DockerEnvironment, portainer.ContainerEngineDocker)
	agentDocker := ep(2, portainer.AgentOnDockerEnvironment, portainer.ContainerEngineDocker)
	edgeAgentDocker := ep(3, portainer.EdgeAgentOnDockerEnvironment, portainer.ContainerEngineDocker)
	podman := ep(4, portainer.DockerEnvironment, portainer.ContainerEnginePodman)
	agentPodman := ep(5, portainer.AgentOnDockerEnvironment, portainer.ContainerEnginePodman)
	edgeAgentPodman := ep(6, portainer.EdgeAgentOnDockerEnvironment, portainer.ContainerEnginePodman)
	k8sLocal := ep(7, portainer.KubernetesLocalEnvironment, "")
	agentK8s := ep(8, portainer.AgentOnKubernetesEnvironment, "")
	edgeAgentK8s := ep(9, portainer.EdgeAgentOnKubernetesEnvironment, "")
	azure := ep(10, portainer.AzureEnvironment, "")

	type args struct {
		endpoints     []portainer.Endpoint
		platformTypes []portainer.PlatformType
	}
	tests := []struct {
		name string
		args args
		want []portainer.Endpoint
	}{
		// Docker platform types
		{
			name: "DockerEnvironment is Docker platform",
			args: args{endpoints: []portainer.Endpoint{docker}, platformTypes: []portainer.PlatformType{portainer.DockerPlatformType}},
			want: []portainer.Endpoint{docker},
		},
		{
			name: "AgentOnDockerEnvironment is Docker platform",
			args: args{endpoints: []portainer.Endpoint{agentDocker}, platformTypes: []portainer.PlatformType{portainer.DockerPlatformType}},
			want: []portainer.Endpoint{agentDocker},
		},
		{
			name: "EdgeAgentOnDockerEnvironment is Docker platform",
			args: args{endpoints: []portainer.Endpoint{edgeAgentDocker}, platformTypes: []portainer.PlatformType{portainer.DockerPlatformType}},
			want: []portainer.Endpoint{edgeAgentDocker},
		},
		// Podman platform types
		{
			name: "DockerEnvironment with Podman engine is Podman platform",
			args: args{endpoints: []portainer.Endpoint{podman}, platformTypes: []portainer.PlatformType{portainer.PodmanPlatformType}},
			want: []portainer.Endpoint{podman},
		},
		{
			name: "AgentOnDockerEnvironment with Podman engine is Podman platform",
			args: args{endpoints: []portainer.Endpoint{agentPodman}, platformTypes: []portainer.PlatformType{portainer.PodmanPlatformType}},
			want: []portainer.Endpoint{agentPodman},
		},
		{
			name: "EdgeAgentOnDockerEnvironment with Podman engine is Podman platform",
			args: args{endpoints: []portainer.Endpoint{edgeAgentPodman}, platformTypes: []portainer.PlatformType{portainer.PodmanPlatformType}},
			want: []portainer.Endpoint{edgeAgentPodman},
		},
		// Kubernetes platform types
		{
			name: "KubernetesLocalEnvironment is Kubernetes platform",
			args: args{endpoints: []portainer.Endpoint{k8sLocal}, platformTypes: []portainer.PlatformType{portainer.KubernetesPlatformType}},
			want: []portainer.Endpoint{k8sLocal},
		},
		{
			name: "AgentOnKubernetesEnvironment is Kubernetes platform",
			args: args{endpoints: []portainer.Endpoint{agentK8s}, platformTypes: []portainer.PlatformType{portainer.KubernetesPlatformType}},
			want: []portainer.Endpoint{agentK8s},
		},
		{
			name: "EdgeAgentOnKubernetesEnvironment is Kubernetes platform",
			args: args{endpoints: []portainer.Endpoint{edgeAgentK8s}, platformTypes: []portainer.PlatformType{portainer.KubernetesPlatformType}},
			want: []portainer.Endpoint{edgeAgentK8s},
		},
		// Azure platform type
		{
			name: "AzureEnvironment is Azure platform",
			args: args{endpoints: []portainer.Endpoint{azure}, platformTypes: []portainer.PlatformType{portainer.AzurePlatformType}},
			want: []portainer.Endpoint{azure},
		},
		// Filter behaviour
		{
			name: "filters out non-matching platform types",
			args: args{
				endpoints:     []portainer.Endpoint{docker, k8sLocal, azure},
				platformTypes: []portainer.PlatformType{portainer.DockerPlatformType},
			},
			want: []portainer.Endpoint{docker},
		},
		{
			name: "multiple platform types returns all matches",
			args: args{
				endpoints:     []portainer.Endpoint{docker, agentDocker, edgeAgentDocker, podman, k8sLocal, agentK8s, edgeAgentK8s, azure},
				platformTypes: []portainer.PlatformType{portainer.DockerPlatformType, portainer.KubernetesPlatformType},
			},
			want: []portainer.Endpoint{docker, agentDocker, edgeAgentDocker, k8sLocal, agentK8s, edgeAgentK8s},
		},
		{
			name: "Podman endpoints not returned when filtering for Docker",
			args: args{
				endpoints:     []portainer.Endpoint{docker, podman, agentPodman},
				platformTypes: []portainer.PlatformType{portainer.DockerPlatformType},
			},
			want: []portainer.Endpoint{docker},
		},
		{
			name: "returns empty when no endpoints match filter",
			args: args{
				endpoints:     []portainer.Endpoint{k8sLocal, azure},
				platformTypes: []portainer.PlatformType{portainer.DockerPlatformType},
			},
			want: []portainer.Endpoint{},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equalf(t, tt.want, filterEndpointsByPlatform(tt.args.endpoints, tt.args.platformTypes), "filterEndpointsByPlatform(%v, %v)", tt.args.endpoints, tt.args.platformTypes)
		})
	}
}

func Test_FilterQuery_PlatformTypes(t *testing.T) {
	t.Parallel()
	dockerEndpoint := portainer.Endpoint{ID: 1, GroupID: 1, Type: portainer.DockerEnvironment}
	kubernetesEndpoint := portainer.Endpoint{ID: 2, GroupID: 1, Type: portainer.KubernetesLocalEnvironment}
	azureEndpoint := portainer.Endpoint{ID: 3, GroupID: 1, Type: portainer.AzureEnvironment}

	endpoints := []portainer.Endpoint{dockerEndpoint, kubernetesEndpoint, azureEndpoint}
	handler := setupFilterTest(t, endpoints)

	tests := []filterTest{
		{
			title:    "platformTypes filter returns only matching platform",
			expected: []portainer.EndpointID{dockerEndpoint.ID},
			query:    EnvironmentsQuery{platformTypes: []portainer.PlatformType{portainer.DockerPlatformType}},
		},
		{
			title:    "multiple platformTypes returns all matching platforms",
			expected: []portainer.EndpointID{dockerEndpoint.ID, kubernetesEndpoint.ID},
			query:    EnvironmentsQuery{platformTypes: []portainer.PlatformType{portainer.DockerPlatformType, portainer.KubernetesPlatformType}},
		},
	}

	runTests(tests, t, handler, endpoints)
}

func Test_FilterQuery_Outdated(t *testing.T) {
	t.Parallel()
	currentVersion := portainer.APIVersion
	upToDateEndpoint := portainer.Endpoint{ID: 1, GroupID: 1, Type: portainer.AgentOnDockerEnvironment}
	upToDateEndpoint.Agent.Version = currentVersion

	outdatedEndpoint := portainer.Endpoint{ID: 2, GroupID: 1, Type: portainer.AgentOnDockerEnvironment}
	outdatedEndpoint.Agent.Version = "2.0.0"

	endpoints := []portainer.Endpoint{upToDateEndpoint, outdatedEndpoint}
	handler := setupFilterTest(t, endpoints)

	tests := []filterTest{
		{
			title:    "outdated filter returns only outdated endpoints",
			expected: []portainer.EndpointID{outdatedEndpoint.ID},
			query:    EnvironmentsQuery{outdated: true},
		},
		{
			title:    "outdated=false returns all endpoints",
			expected: []portainer.EndpointID{upToDateEndpoint.ID, outdatedEndpoint.ID},
			query:    EnvironmentsQuery{outdated: false},
		},
	}

	runTests(tests, t, handler, endpoints)
}

func Test_parseQuery_emptyArrayParams(t *testing.T) {
	t.Parallel()

	makeRequest := func(rawQuery string) *http.Request {
		r := &http.Request{URL: &url.URL{RawQuery: rawQuery}}
		require.NoError(t, r.ParseForm())
		return r
	}

	tests := []struct {
		name  string
		query string
	}{
		{name: "empty status", query: "status="},
		{name: "empty endpointIds", query: "endpointIds="},
		{name: "empty groupIds", query: "groupIds="},
		{name: "empty tagIds", query: "tagIds="},
		{name: "multiple empty params", query: "status=&groupIds=&tagIds="},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := parseQuery(makeRequest(tt.query))
			require.NoError(t, err)
		})
	}
}
