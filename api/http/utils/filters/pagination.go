package filters

type PaginationQueryParams struct {
	start int
	limit int
}

func paginateFn[T any](items []T, params PaginationQueryParams) []T {
	if params.limit <= 0 {
		return items
	}

	itemsCount := len(items)

	// enforce start in [0, len(items)]
	start := min(max(params.start, 0), itemsCount)

	// enforce end <= len(items) (max is unnecessary since limit > 0 and start >= 0)
	end := min(start+params.limit, itemsCount)

	return items[start:end]
}
