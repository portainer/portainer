package useractivity

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type logsListResponse struct {
	Logs       []*portainer.UserActivityLog `json:"logs"`
	TotalCount int                          `json:"totalCount"`
}

// @id LogsList
// @summary List user activity logs
// @description List logs by provided query
// @description **Access policy**: admin
// @tags useractivity
// @security jwt
// @produce json
// @param offset query int false "Pagination offset"
// @param limit query int false "Limit results"
// @param before query int false "Results before timestamp (unix)"
// @param after query int false "Results after timestamp (unix)"
// @param sortBy query string false "Sort by this column" Enum("Timestamp", "Context", "Username", "Action")
// @param sortDesc query bool false "Sort order, if true will return results by descending order"
// @param keyword query string false "Query logs by this keyword"
// @success 200 {object} logsListResponse "Success"
// @failure 500 "Server error"
// @router /useractivity/activitylogs [get]
func (handler *Handler) logsList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	offset, _ := request.RetrieveNumericQueryParameter(r, "offset", true)
	limit, _ := request.RetrieveNumericQueryParameter(r, "limit", true)
	before, _ := request.RetrieveNumericQueryParameter(r, "before", true)
	after, _ := request.RetrieveNumericQueryParameter(r, "after", true)
	sortBy, _ := request.RetrieveQueryParameter(r, "sortBy", true)
	sortDesc, _ := request.RetrieveBooleanQueryParameter(r, "sortDesc", true)
	keyword, _ := request.RetrieveQueryParameter(r, "keyword", true)

	opts := portainer.UserActivityLogBaseQuery{
		Offset:          offset,
		Limit:           limit,
		BeforeTimestamp: int64(before),
		AfterTimestamp:  int64(after),
		SortBy:          sortBy,
		SortDesc:        sortDesc,
		Keyword:         keyword,
	}

	logs, totalCount, err := handler.UserActivityStore.GetUserActivityLogs(opts)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve authentication logs",
			Err:        err,
		}
	}

	return response.JSON(w, logsListResponse{
		Logs:       logs,
		TotalCount: totalCount,
	})
}
