package slices

// Contains is a generic function that returns true if the element is contained within the slice
func Contains[T comparable](elems []T, v T) bool {
	for _, s := range elems {
		if v == s {
			return true
		}
	}
	return false
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
