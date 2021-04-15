package useractivity

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/useractivity"
)

// @id LogsCSV
// @summary Download user activity logs as CSV
// @description Download user activity logs as CSV by provided query
// @description **Access policy**: admin
// @tags useractivity
// @security jwt
// @produce text/csv
// @param before query int false "Results before timestamp (unix)"
// @param after query int false "Results after timestamp (unix)"
// @param sortBy query string false "Sort by this column" Enum("Timestamp", "Context", "Username", "Action")
// @param sortDesc query bool false "Sort order, if true will return results by descending order"
// @param keyword query string false "Query logs by this keyword"
// @success 200 string "Success"
// @failure 500 "Server error"
// @router /useractivity/logs.csv [get]
func (handler *Handler) logsCSV(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	before, _ := request.RetrieveNumericQueryParameter(r, "before", true)
	after, _ := request.RetrieveNumericQueryParameter(r, "after", true)
	sortBy, _ := request.RetrieveQueryParameter(r, "sortBy", true)
	sortDesc, _ := request.RetrieveBooleanQueryParameter(r, "sortDesc", true)
	keyword, _ := request.RetrieveQueryParameter(r, "keyword", true)

	opts := portainer.UserActivityLogBaseQuery{
		BeforeTimestamp: int64(before),
		AfterTimestamp:  int64(after),
		SortBy:          sortBy,
		SortDesc:        sortDesc,
		Keyword:         keyword,
	}

	logs, _, err := handler.UserActivityStore.GetUserActivityLogs(opts)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve logs",
			Err:        err,
		}
	}

	err = useractivity.MarshalLogsToCSV(w, logs)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to marshal logs to csv",
			Err:        err,
		}
	}

	w.Header().Set("Content-Disposition", "attachment; filename=\"logs.csv\"")
	w.Header().Set("Content-Type", "text/csv")

	return nil
}
