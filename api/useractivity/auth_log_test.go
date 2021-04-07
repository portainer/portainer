package useractivity

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	portainer "github.com/portainer/portainer/api"
)

func BenchmarkAuthLog(b *testing.B) {
	defer timeTrack(time.Now(), "AuthActivityLog")

	// https://github.com/golang/go/issues/41062
	// bug in go 1.15 causes b.TempDir() to break in benchmarks
	// TODO remove in go 1.16

	err := os.RemoveAll("./useractivity.db")
	if err != nil {
		b.Fatalf("Failed removing db: %s", err)
	}

	store, err := setup("")
	if err != nil {
		b.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	for i := 0; i < 100; i++ {
		_, err = store.LogAuthActivity("username", "endpoint", portainer.AuthenticationInternal, testType)
		if err != nil {
			b.Fatalf("Failed adding activity log: %s", err)
		}
	}

	count, err := store.db.Count(&portainer.AuthActivityLog{})
	if err != nil {
		fmt.Println(err)
	}

	fmt.Printf("Number of logs: %d\n", count)

}

const (
	testType = portainer.AuthenticationActivityType(0)
)

func setup(path string) (*Store, error) {
	store, err := NewUserActivityStore(path)
	if err != nil {
		return nil, fmt.Errorf("Failed creating new store: %w", err)
	}

	return store, nil
}

func TestAddActivity(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	_, err = store.LogAuthActivity("username", "endpoint", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	count, err := store.db.Count(&portainer.AuthActivityLog{})
	if err != nil {
		t.Fatalf("Failed counting activities: %s", err)
	}

	assert.Equal(t, 1, count, "Store should have one element")
}

func TestGetLogs(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogAuthActivity("username1", "endpoint1", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log2, err := store.LogAuthActivity("username2", "endpoint2", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log3, err := store.LogAuthActivity("username3", "endpoint3", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	logs, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{})
	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.AuthActivityLog{log1, log2, log3}, logs)
}

func TestGetLogsByTimestamp(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogAuthActivity("username1", "endpoint1", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	time.Sleep(time.Second * 1)

	log2, err := store.LogAuthActivity("username2", "endpoint2", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	time.Sleep(time.Second * 1)

	log3, err := store.LogAuthActivity("username3", "endpoint3", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	logs, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{
		BeforeTimestamp: log3.Timestamp - 1,
		AfterTimestamp:  log1.Timestamp + 1,
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, log2, logs[0], "logs are not equal")
}

func TestGetLogsByKeyword(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogAuthActivity("username1", "endpoint1", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log2, err := store.LogAuthActivity("username2", "endpoint2", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log3, err := store.LogAuthActivity("username3", "endpoint3", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	// like
	shouldHaveAllLogs, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{
		Keyword: "username",
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.AuthActivityLog{log1, log2, log3}, shouldHaveAllLogs)

	// username
	shouldHaveOnlyLog1, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{
		Keyword: "username1",
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, log1, shouldHaveOnlyLog1[0])

	// origin
	shouldHaveOnlyLog3, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{
		Keyword: "endpoint3",
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, log3, shouldHaveOnlyLog3[0])
}

func TestGetLogsByContext(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogAuthActivity("username1", "endpoint1", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log2, err := store.LogAuthActivity("username2", "endpoint2", portainer.AuthenticationLDAP, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log3, err := store.LogAuthActivity("username3", "endpoint3", portainer.AuthenticationOAuth, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	// one type
	shouldHaveLog2, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{
		ContextTypes: []portainer.AuthenticationMethod{
			portainer.AuthenticationLDAP,
		},
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.AuthActivityLog{log2}, shouldHaveLog2)

	// two types
	shouldHaveLog1And3, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{
		ContextTypes: []portainer.AuthenticationMethod{
			portainer.AuthenticationInternal,
			portainer.AuthenticationOAuth,
		},
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.AuthActivityLog{log1, log3}, shouldHaveLog1And3)
}

func TestGetLogsByType(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogAuthActivity("username1", "endpoint1", portainer.AuthenticationInternal, portainer.AuthenticationActivityFailure)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log2, err := store.LogAuthActivity("username2", "endpoint2", portainer.AuthenticationLDAP, portainer.AuthenticationActivityLogOut)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log3, err := store.LogAuthActivity("username3", "endpoint3", portainer.AuthenticationOAuth, portainer.AuthenticationActivitySuccess)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	// one type
	shouldHaveLog2, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{
		ActivityTypes: []portainer.AuthenticationActivityType{
			portainer.AuthenticationActivityLogOut,
		},
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.AuthActivityLog{log2}, shouldHaveLog2)

	// two types
	shouldHaveLog1And3, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{
		ActivityTypes: []portainer.AuthenticationActivityType{
			portainer.AuthenticationActivityFailure,
			portainer.AuthenticationActivitySuccess,
		},
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.AuthActivityLog{log1, log3}, shouldHaveLog1And3)
}

func TestSortOrderAndPaginate(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogAuthActivity("username1", "endpoint1", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log2, err := store.LogAuthActivity("username2", "endpoint2", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log3, err := store.LogAuthActivity("username3", "endpoint3", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log4, err := store.LogAuthActivity("username4", "endpoint4", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	shouldBeLog4AndLog3, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{
		SortDesc: true,
		SortBy:   "Username",
		Offset:   0,
		Limit:    2,
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.AuthActivityLog{log4, log3}, shouldBeLog4AndLog3)

	shouldBeLog2AndLog1, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{
		SortDesc: true,
		SortBy:   "Username",
		Offset:   2,
		Limit:    2,
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.AuthActivityLog{log2, log1}, shouldBeLog2AndLog1)
}

func TestGetLogsDesc(t *testing.T) {
	store, err := setup(t.TempDir())
	if err != nil {
		t.Fatalf("Failed setup: %s", err)
	}

	defer store.Close()

	log1, err := store.LogAuthActivity("username1", "endpoint1", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log2, err := store.LogAuthActivity("username2", "endpoint2", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	log3, err := store.LogAuthActivity("username3", "endpoint3", portainer.AuthenticationInternal, testType)
	if err != nil {
		t.Fatalf("Failed adding activity log: %s", err)
	}

	logs, _, err := store.GetAuthLogs(portainer.AuthLogsQuery{
		SortDesc: true,
	})

	if err != nil {
		t.Fatalf("failed fetching logs: %s", err)
	}

	assert.Equal(t, []*portainer.AuthActivityLog{log3, log2, log1}, logs)
}

func timeTrack(start time.Time, name string) {
	elapsed := time.Since(start)
	fmt.Printf("%s took %s\n", name, elapsed)
}
