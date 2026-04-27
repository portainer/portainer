package slicesx

// Split elements in two slices.
// The first contains elements predicate returns truthy for
// The second contains elements predicate returns falsey for
// The predicate is invoked with one argument: (value).
func Partition[T any](input []T, predicate func(T) bool) ([]T, []T) {
	truthy := make([]T, 0)
	falsey := make([]T, 0)

	for i := range input {
		if predicate(input[i]) {
			truthy = append(truthy, input[i])
		} else {
			falsey = append(falsey, input[i])
		}
	}
	return truthy, falsey
}
