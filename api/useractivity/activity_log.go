package useractivity

import (
	"fmt"
	"time"

	"github.com/asdine/storm/v3/q"
	portainer "github.com/portainer/portainer/api"
)

func (store *Store) LogUserActivity(username, context, action string, payload []byte) (*portainer.UserActivityLog, error) {
	activity := &portainer.UserActivityLog{
		UserActivityLogBase: portainer.UserActivityLogBase{
			Timestamp: time.Now().Unix(),
			Username:  username,
		},
		Context: context,
		Action:  action,
		Payload: payload,
	}

	err := store.db.Save(activity)
	if err != nil {
		return nil, fmt.Errorf("failed saving activity to db: %w", err)
	}

	return activity, nil
}

// GetActivityLogs queries the db for activity logs
// it returns the logs in this page (offset/limit) and the amount of logs in total for this query
func (store *Store) GetUserActivityLogs(opts portainer.UserActivityLogBaseQuery) ([]*portainer.UserActivityLog, int, error) {
	matchers := []q.Matcher{}

	if opts.Keyword != "" {
		matchers = append(matchers, q.Or(q.Re("Context", opts.Keyword), q.Re("Action", opts.Keyword), q.Re("Payload", opts.Keyword), q.Re("Username", opts.Keyword)))
	}

	activities := []*portainer.UserActivityLog{}
	count, err := store.getLogs(&activities, &portainer.UserActivityLog{}, opts, matchers)
	if err != nil {
		return nil, 0, err
	}

	return activities, count, nil
}
