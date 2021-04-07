package useractivity

import (
	"fmt"
	"time"

	"github.com/asdine/storm/v3"
	"github.com/asdine/storm/v3/q"
	portainer "github.com/portainer/portainer/api"
)

// LogAuthActivity logs a new authentication activity log
func (store *Store) LogAuthActivity(username, origin string, context portainer.AuthenticationMethod, activityType portainer.AuthenticationActivityType) (*portainer.AuthActivityLog, error) {
	activity := &portainer.AuthActivityLog{
		Type:      activityType,
		Timestamp: time.Now().Unix(),
		Username:  username,
		Origin:    origin,
		Context:   context,
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
	if opts.Limit == 0 {
		opts.Limit = 50
	}

	if opts.SortBy == "" {
		opts.SortBy = "Timestamp"
	}

	matchers := []q.Matcher{
		q.Gte("Timestamp", opts.AfterTimestamp),
	}

	if opts.BeforeTimestamp != 0 {
		matchers = append(matchers, q.Lte("Timestamp", opts.BeforeTimestamp))
	}

	if opts.Keyword != "" {
		matchers = append(matchers, q.Or(q.Re("Origin", opts.Keyword), q.Re("Username", opts.Keyword)))
	}

	if len(opts.ContextTypes) > 0 {
		matchers = append(matchers, q.In("Context", opts.ContextTypes))
	}

	if len(opts.ActivityTypes) > 0 {
		matchers = append(matchers, q.In("Type", opts.ActivityTypes))
	}

	query := store.db.Select(matchers...)

	count, err := query.Count(&portainer.AuthActivityLog{})
	if err != nil {
		return nil, 0, err
	}

	limitedQuery := query.Limit(opts.Limit).Skip(opts.Offset).OrderBy(opts.SortBy)

	if opts.SortDesc {
		limitedQuery = limitedQuery.Reverse()
	}

	activities := []*portainer.AuthActivityLog{}
	err = limitedQuery.Find(&activities)
	if err != nil && err != storm.ErrNotFound {
		return nil, 0, err
	}

	return activities, count, nil
}
