package useractivity

import (
	"testing"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func TestAddUserActivity(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	expectedPayloadString := "payload"

	expected := portainer.UserActivityLog{
		UserActivityLogBase: portainer.UserActivityLogBase{
			Username: "username",
		},
		Context: "context",
		Action:  "action",

		Payload: []byte(expectedPayloadString),
	}

	createdLog, err := store.LogUserActivity(expected.Username, expected.Context, expected.Action, expected.Payload)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	assert.Equal(t, expected.Username, createdLog.Username)
	assert.Equal(t, expected.Context, createdLog.Context)
	assert.Equal(t, expected.Action, createdLog.Action)
	assert.Equal(t, expected.Payload, createdLog.Payload)
	assert.Equal(t, expectedPayloadString, string(createdLog.Payload), "stored payload should have the same value")

	var logs []*portainer.UserActivityLog

	err = store.db.All(&logs)
	if err != nil {
		t.Fatalf("Failed retrieving activities: %s", err)
	}

	assert.Equal(t, 1, len(logs), "Store should have one element")
	assert.Equal(t, createdLog, logs[0], "logs should be equal")
}

func TestGetUserActivityLogs(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogUserActivity("username1", "context1", "action1", []byte("payload1"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log2, err := store.LogUserActivity("username2", "context2", "action2", []byte("payload2"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log3, err := store.LogUserActivity("username3", "context3", "action3", []byte("payload3"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	logs, _, err := store.GetUserActivityLogs(portainer.UserActivityLogBaseQuery{})
	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.UserActivityLog{log1, log2, log3}, logs)
}

func TestGetUserActivityLogsByTimestamp(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogUserActivity("username1", "context1", "action1", []byte("payload1"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	time.Sleep(time.Second * 1)

	log2, err := store.LogUserActivity("username2", "context2", "action2", []byte("payload2"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	time.Sleep(time.Second * 1)

	log3, err := store.LogUserActivity("username3", "context3", "action3", []byte("payload3"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	logs, _, err := store.GetUserActivityLogs(portainer.UserActivityLogBaseQuery{
		BeforeTimestamp: log3.Timestamp - 1,
		AfterTimestamp:  log1.Timestamp + 1,
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, log2, logs[0], "logs are not equal")
}

func TestGetUserActivityLogsByKeyword(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogUserActivity("username1", "context1", "action1", []byte("success"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log2, err := store.LogUserActivity("username2", "context2", "action2", []byte("error"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log3, err := store.LogUserActivity("username3", "context3", "action3", []byte("success"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	// like
	shouldHaveAllLogs, _, err := store.GetUserActivityLogs(portainer.UserActivityLogBaseQuery{
		Keyword: "username",
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.UserActivityLog{log1, log2, log3}, shouldHaveAllLogs)

	// username
	shouldHaveOnlyLog1, _, err := store.GetUserActivityLogs(portainer.UserActivityLogBaseQuery{
		Keyword: "username1",
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, log1, shouldHaveOnlyLog1[0])

	// action
	shouldHaveOnlyLog3, _, err := store.GetUserActivityLogs(portainer.UserActivityLogBaseQuery{
		Keyword: "action3",
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, 1, len(shouldHaveOnlyLog3))
	assert.Equal(t, log3, shouldHaveOnlyLog3[0])
}

func TestGetUserActivityLogsSortOrderAndPaginate(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogUserActivity("username1", "context1", "action1", []byte("payload1"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log2, err := store.LogUserActivity("username2", "context2", "action2", []byte("payload2"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log3, err := store.LogUserActivity("username3", "context3", "action3", []byte("payload3"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log4, err := store.LogUserActivity("username4", "context4", "action4", []byte("payload4"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	shouldBeLog4AndLog3, _, err := store.GetUserActivityLogs(portainer.UserActivityLogBaseQuery{
		SortDesc: true,
		SortBy:   "Username",
		Offset:   0,
		Limit:    2,
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.UserActivityLog{log4, log3}, shouldBeLog4AndLog3)

	shouldBeLog2AndLog1, _, err := store.GetUserActivityLogs(portainer.UserActivityLogBaseQuery{
		SortDesc: true,
		SortBy:   "Username",
		Offset:   2,
		Limit:    2,
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.UserActivityLog{log2, log1}, shouldBeLog2AndLog1)
}

func TestGetUserActivityLogsDesc(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogUserActivity("username1", "context1", "action1", []byte("payload1"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log2, err := store.LogUserActivity("username2", "context2", "action2", []byte("payload2"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log3, err := store.LogUserActivity("username3", "context3", "action3", []byte("payload3"))
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	logs, _, err := store.GetUserActivityLogs(portainer.UserActivityLogBaseQuery{
		SortDesc: true,
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.UserActivityLog{log3, log2, log1}, logs)
}
