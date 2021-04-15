package useractivity

import (
	"fmt"
	"time"

	"github.com/asdine/storm/v3/q"
	portainer "github.com/portainer/portainer/api"
)

// LogAuthActivity logs a new authentication activity log
func (store *Store) LogAuthActivity(username, origin string, context portainer.AuthenticationMethod, activityType portainer.AuthenticationActivityType) (*portainer.AuthActivityLog, error) {
	activity := &portainer.AuthActivityLog{
		Type: activityType,
		UserActivityLogBase: portainer.UserActivityLogBase{
			Timestamp: time.Now().Unix(),
			Username:  username,
		},
		Origin:  origin,
		Context: context,
	}

	err := store.db.Save(activity)
	if err != nil {
		return nil, fmt.Errorf("failed saving activity to db: %w", err)
	}

	return activity, nil
}

// GetAuthLogs queries the db for authentication activity logs
// it returns the logs in this page (offset/limit) and the amount of logs in total for this query
func (store *Store) GetAuthLogs(opts portainer.AuthLogsQuery) ([]*portainer.AuthActivityLog, int, error) {
	matchers := []q.Matcher{}

	if len(opts.ContextTypes) > 0 {
		matchers = append(matchers, q.In("Context", opts.ContextTypes))
	}

	if len(opts.ActivityTypes) > 0 {
		matchers = append(matchers, q.In("Type", opts.ActivityTypes))
	}

	if opts.Keyword != "" {
		matchers = append(matchers, q.Or(q.Re("Origin", opts.Keyword), q.Re("Username", opts.Keyword)))
	}

	activities := []*portainer.AuthActivityLog{}
	count, err := store.getLogs(&activities, &portainer.AuthActivityLog{}, opts.UserActivityLogBaseQuery, matchers)
	if err != nil {
		return nil, 0, err
	}

	return activities, count, nil
}
