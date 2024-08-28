package slicesx

// Map applies the given function to each element of the slice and returns a new slice with the results
func Map[T, U any](s []T, f func(T) U) []U {
	result := make([]U, len(s))
	for i, v := range s {
		result[i] = f(v)
	}
	return result
}

// Filter returns a new slice containing only the elements of the slice for which the given predicate returns true
func Filter[T any](s []T, predicate func(T) bool) []T {
	n := 0
	for _, v := range s {
		if predicate(v) {
			s[n] = v
			n++
		}
	}

	return s[:n]
}

func Unique[T comparable](items []T) []T {
	return UniqueBy(items, func(item T) T {
		return item
	})
}

func UniqueBy[ItemType any, ComparableType comparable](items []ItemType, accessorFunc func(ItemType) ComparableType) []ItemType {
	includedItems := make(map[ComparableType]bool)
	result := []ItemType{}

	for _, item := range items {
		if _, isIncluded := includedItems[accessorFunc(item)]; !isIncluded {
			includedItems[accessorFunc(item)] = true
			result = append(result, item)
		}
	}

	return result
}
