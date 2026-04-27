package slicesx

func GroupBy[A any, K comparable](input []A, f func(A) K) map[K][]A {
	result := make(map[K][]A)
	for _, v := range input {
		key := f(v)
		result[key] = append(result[key], v)
	}
	return result
}
