package useractivity

import (
	"net/http"
	"net/url"
	"strconv"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"
)

type authLogsListResponse struct {
	Logs       []*portainer.AuthActivityLog `json:"logs"`
	TotalCount int                          `json:"totalCount"`
}

// @id AuthLogsList
// @summary List auth activity logs
// @description List logs by provided query
// @description **Access policy**: admin
// @tags useractivity
// @security jwt
// @produce json
// @param offset query int false "Pagination offset"
// @param limit query int false "Limit results"
// @param before query int false "Results before timestamp (unix)"
// @param after query int false "Results after timestamp (unix)"
// @param sortBy query string false "Sort by this column" Enum("Type", "Timestamp", "Origin", "Context", "Username", "Result")
// @param sortDesc query bool false "Sort order, if true will return results by descending order"
// @param keyword query string false "Query logs by this keyword"
// @success 200 {array} portainer.AuthActivityLog "Success"
// @failure 500 "Server error"
// @router /useractivity/authlogs [get]
func (handler *Handler) authLogsList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	offset, _ := request.RetrieveNumericQueryParameter(r, "offset", true)
	limit, _ := request.RetrieveNumericQueryParameter(r, "limit", true)
	before, _ := request.RetrieveNumericQueryParameter(r, "before", true)
	after, _ := request.RetrieveNumericQueryParameter(r, "after", true)
	sortBy, _ := request.RetrieveQueryParameter(r, "sortBy", true)
	sortDesc, _ := request.RetrieveBooleanQueryParameter(r, "sortDesc", true)
	keyword, _ := request.RetrieveQueryParameter(r, "keyword", true)

	contextTypes, err := parseContextTypes(r.URL.RawQuery)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to parse query string",
			Err:        err,
		}
	}

	activityTypes, err := parseActivityTypes(r.URL.RawQuery)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to parse query string",
			Err:        err,
		}
	}

	opts := portainer.AuthLogsQuery{
		UserActivityLogBaseQuery: portainer.UserActivityLogBaseQuery{
			Offset:          offset,
			Limit:           limit,
			BeforeTimestamp: int64(before),
			AfterTimestamp:  int64(after),
			SortBy:          sortBy,
			SortDesc:        sortDesc,
			Keyword:         keyword,
		},
		ContextTypes:  contextTypes,
		ActivityTypes: activityTypes,
	}

	logs, totalCount, err := handler.UserActivityStore.GetAuthLogs(opts)
	if err != nil {
		return &httperror.HandlerError{
			StatusCode: http.StatusInternalServerError,
			Message:    "Unable to retrieve authentication logs",
			Err:        err,
		}
	}

	return response.JSON(w, authLogsListResponse{
		Logs:       logs,
		TotalCount: totalCount,
	})
}

func parseActivityTypes(query string) ([]portainer.AuthenticationActivityType, error) {
	numbers, err := parseNumberArrayQuery(query, "types")
	if err != nil {
		return nil, err
	}

	types := []portainer.AuthenticationActivityType{}

	for _, val := range numbers {
		types = append(types, portainer.AuthenticationActivityType(val))
	}

	return types, nil
}

func parseContextTypes(query string) ([]portainer.AuthenticationMethod, error) {
	numbers, err := parseNumberArrayQuery(query, "contexts")
	if err != nil {
		return nil, err
	}

	types := []portainer.AuthenticationMethod{}

	for _, val := range numbers {
		types = append(types, portainer.AuthenticationMethod(val))
	}

	return types, nil
}

func parseArrayQuery(query string, key string) ([]string, error) {
	values, err := url.ParseQuery(query)
	if err != nil {
		return nil, err
	}

	return values[key], nil
}

func parseNumberArrayQuery(query string, key string) ([]int, error) {
	stringArr, err := parseArrayQuery(query, key)
	if err != nil {
		return nil, err
	}

	numberArr := []int{}
	for _, val := range stringArr {
		num, err := strconv.Atoi(val)
		if err != nil {
			return nil, err
		}

		numberArr = append(numberArr, num)
	}

	return numberArr, nil

}
