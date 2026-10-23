package slicesx

// Reduce applies f to each element of the slice, carrying an accumulator.
// It returns the final accumulator value.
func Reduce[T, U any](s []T, init U, f func(U, T) U) U {
	acc := init
	for _, v := range s {
		acc = f(acc, v)
	}
	return acc
}
