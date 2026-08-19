package filters

import (
	"net/http"
	"strconv"
)

type FilterResult[T any] struct {
	Items          []T
	TotalCount     int
	TotalAvailable int
}

type Config[T any] struct {
	SearchAccessors []SearchAccessor[T]
	SortBindings    []SortBinding[T]
}

func SearchOrderAndPaginate[T any](items []T, params QueryParams, searchConfig Config[T]) FilterResult[T] {
	totalAvailable := len(items)

	items = searchFn(items, params.SearchQueryParams, searchConfig.SearchAccessors)
	items = sortFn(items, params.SortQueryParams, searchConfig.SortBindings)

	totalCount := len(items)
	items = paginateFn(items, params.PaginationQueryParams)

	return FilterResult[T]{
		Items:          items,
		TotalCount:     totalCount,
		TotalAvailable: totalAvailable,
	}
}

func ApplyFilterResultsHeaders[T any](w *http.ResponseWriter, result FilterResult[T]) {
	(*w).Header().Set("X-Total-Count", strconv.Itoa(result.TotalCount))
	(*w).Header().Set("X-Total-Available", strconv.Itoa(result.TotalAvailable))
}
