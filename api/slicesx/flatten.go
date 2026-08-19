package slicesx

import "slices"

func Flatten[T any](input [][]T) []T {
	return slices.Concat(input...)
}
