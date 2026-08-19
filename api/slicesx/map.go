package slicesx

// Map applies the given function to each element of the slice and returns a new slice with the results
func Map[T, U any](s []T, f func(T) U) []U {
	result := make([]U, len(s))
	for i, v := range s {
		result[i] = f(v)
	}
	return result
}

// FlatMap applies the given function to each element of the slice and returns a new slice with the flattened results
func FlatMap[T, U any](s []T, f func(T) []U) []U {
	return Flatten(Map(s, f))
}
