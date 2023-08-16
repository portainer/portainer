package slices

// Contains is a generic function that returns true if the element is contained within the slice
func Contains[T comparable](elems []T, v T) bool {
	return ContainsFunc(elems, func(s T) bool {
		return s == v
	})
}

// Contains is a generic function that returns true if the element is contained within the slice
func ContainsFunc[T any](elems []T, f func(T) bool) bool {
	for _, s := range elems {
		if f(s) {
			return true
		}
	}
	return false
}

func Find[T any](elems []T, f func(T) bool) (T, bool) {
	for _, s := range elems {
		if f(s) {
			return s, true
		}
	}

	// return default value
	var result T
	return result, false
}

// IndexFunc returns the first index i satisfying f(s[i]),
// or -1 if none do.
func IndexFunc[E any](s []E, f func(E) bool) int {
	for i, v := range s {
		if f(v) {
			return i
		}
	}
	return -1
}

// RemoveItem removes the first element from the slice that satisfies the given predicate
func RemoveItem[E comparable](s []E, predicate func(E) bool) []E {
	index := IndexFunc(s, predicate)
	if index == -1 {
		return s
	}

	return RemoveIndex(s, index)
}

// RemoveIndex removes the element at the given index from the slice
func RemoveIndex[T any](s []T, index int) []T {
	if len(s) == 0 {
		return s
	}

	if index < 0 || index >= len(s) {
		return s
	}

	s[index] = s[len(s)-1]
	return s[:len(s)-1]
}

// Map applies the given function to each element of the slice and returns a new slice with the results
func Map[T, U any](s []T, f func(T) U) []U {
	result := make([]U, len(s))
	for i, v := range s {
		result[i] = f(v)
	}
	return result
}
