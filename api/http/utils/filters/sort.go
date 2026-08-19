package filters

import "slices"

type SortOrder string

const (
	SortAsc  SortOrder = "asc"
	SortDesc SortOrder = "desc"
)

type SortQueryParams struct {
	sort  string
	order SortOrder
}

type SortOption[T any] func(a, b T) int
type SortBinding[T any] struct {
	Key       string
	Fn        SortOption[T]
	NullsLast func(T) bool // if set, items where this returns true always sort after all others
}

func sortFn[T any](items []T, params SortQueryParams, sorts []SortBinding[T]) []T {
	for _, sort := range sorts {
		if sort.Key == params.sort {
			fn := sort.Fn
			if params.order == SortDesc {
				fn = reverSortFn(fn)
			}
			if sort.NullsLast != nil {
				fn = nullsLastWrap(fn, sort.NullsLast)
			}
			slices.SortStableFunc(items, fn)
		}
	}
	return items
}

func reverSortFn[T any](fn SortOption[T]) SortOption[T] {
	return func(a, b T) int {
		return -1 * fn(a, b)
	}
}

// nullsLastWrap wraps a comparator so that items where isNull returns true
// always sort after all others, regardless of sort direction.
func nullsLastWrap[T any](fn SortOption[T], isNull func(T) bool) SortOption[T] {
	return func(a, b T) int {
		aN, bN := isNull(a), isNull(b)
		if aN && bN {
			return 0
		}
		if aN {
			return 1
		}
		if bN {
			return -1
		}
		return fn(a, b)
	}
}
