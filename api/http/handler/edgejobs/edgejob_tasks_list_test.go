package edgejobs

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/internal/testhelpers"
	"github.com/portainer/portainer/api/roar"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func Test_EdgeJobTasksListHandler(t *testing.T) {
	t.Parallel()
	_, store := datastore.MustNewTestStore(t, true, false)

	handler := NewHandler(testhelpers.NewTestRequestBouncer())
	handler.DataStore = store

	addEnv := func(env *portainer.Endpoint) {
		err := store.EndpointService.Create(env)
		require.NoError(t, err)
	}

	addEdgeGroup := func(group *portainer.EdgeGroup) {
		err := store.EdgeGroupService.Create(group)
		require.NoError(t, err)
	}

	addJob := func(job *portainer.EdgeJob) {
		err := store.EdgeJobService.Create(job)
		require.NoError(t, err)
	}

	envCount := 6

	for i := range envCount {
		addEnv(&portainer.Endpoint{ID: portainer.EndpointID(i + 1), Name: "env_" + strconv.Itoa(i+1)})
	}

	addEdgeGroup(&portainer.EdgeGroup{ID: 1, Name: "edge_group_1", EndpointIDs: roar.FromSlice([]portainer.EndpointID{5, 6})})

	addJob(&portainer.EdgeJob{
		ID: 1,
		Endpoints: map[portainer.EndpointID]portainer.EdgeJobEndpointMeta{
			1: {},
			2: {LogsStatus: portainer.EdgeJobLogsStatusIdle},
			3: {LogsStatus: portainer.EdgeJobLogsStatusPending},
			4: {LogsStatus: portainer.EdgeJobLogsStatusCollected}},
		EdgeGroups: []portainer.EdgeGroupID{1},
	})

	test := func(params string, expect []taskContainer, expectedCount int) {
		rr := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/edge_jobs/1/tasks"+params, nil)
		handler.ServeHTTP(rr, req)
		require.Equal(t, http.StatusOK, rr.Result().StatusCode)

		var response []taskContainer
		err := json.NewDecoder(rr.Body).Decode(&response)
		require.NoError(t, err)

		assert.ElementsMatch(t, expect, response)

		tcStr := rr.Header().Get("x-total-count")
		assert.NotEmpty(t, tcStr)

		totalCount, err := strconv.Atoi(tcStr)
		require.NoError(t, err)
		assert.Equal(t, expectedCount, totalCount)

		taStr := rr.Header().Get("x-total-available")
		assert.NotEmpty(t, taStr)

		totalAvailable, err := strconv.Atoi(taStr)
		require.NoError(t, err)
		assert.Equal(t, envCount, totalAvailable)

	}

	tasks := []taskContainer{
		{},
		{"edgejob_task_1_1", 1, "env_1", 0},
		{"edgejob_task_1_2", 2, "env_2", portainer.EdgeJobLogsStatusIdle},
		{"edgejob_task_1_3", 3, "env_3", portainer.EdgeJobLogsStatusPending},
		{"edgejob_task_1_4", 4, "env_4", portainer.EdgeJobLogsStatusCollected},
		{"edgejob_task_1_5", 5, "env_5", 0},
		{"edgejob_task_1_6", 6, "env_6", 0},
	}

	t.Run("should return no results", func(t *testing.T) {
		test("?search=foo", []taskContainer{}, 0)        // unknown search
		test("?start=100&limit=1", []taskContainer{}, 6) // overflowing start. Still return the correct count header
	})

	t.Run("should return one element", func(t *testing.T) {
		// limit the *returned* results but not the total count
		test("?start=0&limit=1&sort=EndpointName&order=asc", []taskContainer{tasks[1]}, envCount)  // limit
		test("?start=5&limit=10&sort=EndpointName&order=asc", []taskContainer{tasks[6]}, envCount) // start = last element + overflowing limit
		// limit the number of results
		test("?search=env_1", []taskContainer{tasks[1]}, 1) // only 1 result
	})

	t.Run("should filter by status", func(t *testing.T) {
		test("?search=idle", []taskContainer{tasks[1], tasks[2], tasks[5], tasks[6]}, 4) // 0 (default value) is IDLE
		test("?search=pending", []taskContainer{tasks[3]}, 1)
		test("?search=collected", []taskContainer{tasks[4]}, 1)
	})

	t.Run("should return all elements", func(t *testing.T) {
		test("", tasks[1:], envCount)                    // default
		test("?some=invalid_param", tasks[1:], envCount) // unknown query params
		test("?limit=-1", tasks[1:], envCount)           // underflowing limit
		test("?start=100", tasks[1:], envCount)          // overflowing start without limit
		test("?search=env", tasks[1:], envCount)         // search in a match-all keyword
	})

	testError := func(params string, status int) {
		rr := httptest.NewRecorder()
		req := httptest.NewRequest(http.MethodGet, "/edge_jobs/2/tasks"+params, nil)
		handler.ServeHTTP(rr, req)
		require.Equal(t, status, rr.Result().StatusCode)
	}

	t.Run("errors", func(t *testing.T) {
		testError("", http.StatusNotFound) // unknown job id
	})

}
