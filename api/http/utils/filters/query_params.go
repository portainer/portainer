package filters

import (
	"net/http"

	"github.com/portainer/portainer/pkg/libhttp/request"
)

type QueryParams struct {
	SearchQueryParams
	SortQueryParams
	PaginationQueryParams
}

func ExtractListModifiersQueryParams(r *http.Request) QueryParams {
	// search
	search, _ := request.RetrieveQueryParameter(r, "search", true)
	// sorting
	sortField, _ := request.RetrieveQueryParameter(r, "sort", true)
	sortOrder, _ := request.RetrieveQueryParameter(r, "order", true)
	// pagination
	start, _ := request.RetrieveNumericQueryParameter(r, "start", true)
	limit, _ := request.RetrieveNumericQueryParameter(r, "limit", true)

	return QueryParams{
		SearchQueryParams{
			search: search,
		},
		SortQueryParams{
			sort:  sortField,
			order: SortOrder(sortOrder),
		},
		PaginationQueryParams{
			start: start,
			limit: limit,
		},
	}
}
