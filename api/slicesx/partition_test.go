package slicesx_test

import (
	"testing"

	"github.com/portainer/portainer/api/slicesx"
)

func partition[T any](input []T, predicate func(T) bool) [2][]T {
	left, right := slicesx.Partition(input, predicate)
	return [2][]T{left, right}
}

func Test_Partition(t *testing.T) {
	t.Parallel()

	test(t, partition, "Partition even and odd",
		[]int{1, 2, 3, 4, 5, 6, 7, 8, 9},
		[2][]int{{2, 4, 6, 8}, {1, 3, 5, 7, 9}},
		func(x int) bool { return x%2 == 0 },
	)
	test(t, partition, "Partition strings starting with 'A'",
		[]string{"Apple", "Banana", "Avocado", "Grapes", "Apricot"},
		[2][]string{{"Apple", "Avocado", "Apricot"}, {"Banana", "Grapes"}},
		func(s string) bool { return s[0] == 'A' },
	)
	test(t, partition, "Partition strings longer than 5 chars",
		[]string{"Apple", "Banana", "Avocado", "Grapes", "Apricot"},
		[2][]string{{"Banana", "Avocado", "Grapes", "Apricot"}, {"Apple"}},
		func(s string) bool { return len(s) > 5 },
	)
}
