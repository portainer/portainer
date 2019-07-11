package utils

import (
	"strconv"
	"strings"
)

type SlicedFilter []string

func ExtractGroupIdFromFilters(filters SlicedFilter) (int, bool) {
	var filteredID = -1
	var error = true

	if ok, value := FiltersContain(filters, "groupid"); ok {
		split := strings.Split(value, ":")
		if len(split) == 2 {
			id, err := strconv.Atoi(split[1])
			if err == nil {
				filteredID = id
				error = false
			}
		}
	}
	return filteredID, error
}

func StringContainsOneOf(item string, slice SlicedFilter) bool {
	if len(slice) == 1 && strings.Contains(slice[0], "groupid") {
		return true
	}
	for _, filter := range slice {
		if strings.Contains(item, filter) {
			return true
		}
	}
	return false
}

func FiltersContain(slice SlicedFilter, item string) (bool, string) {
	for idx, filter := range slice {
		if strings.Contains(filter, item) {
			return true, slice[idx]
		}
	}
	return false, ""
}

func SliceFilter(filter string) SlicedFilter {
	return strings.Split(filter, " ")
}
