package filters

import (
	"strings"
)

// Return any error to skip the field (for  when matching an unknown state on an enum)
//
// Note: returning ("", nil) will match!
type SearchAccessor[T any] = func(T) (string, error)

type SearchQueryParams struct {
	search string
}

func searchFn[T any](items []T, params SearchQueryParams, accessors []SearchAccessor[T]) []T {
	search := strings.TrimSpace(params.search)

	if search == "" {
		return items
	}

	results := []T{}

	for iIdx := range items {
		for aIdx := range accessors {
			value, err := accessors[aIdx](items[iIdx])
			if err == nil && strings.Contains(strings.ToLower(value), strings.ToLower(search)) {
				results = append(results, items[iIdx])
				break
			}
		}
	}

	return results
}
