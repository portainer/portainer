package slicesx

import "slices"

// Checks if predicate returns truthy for any element of input. Iteration is stopped once predicate returns truthy.
func Some[T any](input []T, predicate func(T) bool) bool {
	return slices.ContainsFunc(input, predicate)
}

// Checks if predicate returns truthy for all elements of input. Iteration is stopped once predicate returns falsey.
//
// Note: This method returns true for empty collections because everything is true of elements of empty collections.
// https://en.wikipedia.org/wiki/Vacuous_truth
func Every[T any](input []T, predicate func(T) bool) bool {
	// if the slice doesn't contain an inverted predicate then all items follow the predicate
	return !slices.ContainsFunc(input, func(t T) bool { return !predicate(t) })
}
