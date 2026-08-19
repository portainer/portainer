package slicesx_test

import (
	"testing"

	"github.com/portainer/portainer/api/slicesx"

	"github.com/stretchr/testify/require"
)

func Test_Filter(t *testing.T) {
	t.Parallel()
	test(t, slicesx.Filter, "Filter even numbers",
		[]int{1, 2, 3, 4, 5, 6, 7, 8, 9},
		[]int{2, 4, 6, 8},
		func(x int) bool { return x%2 == 0 },
	)
	test(t, slicesx.Filter, "Filter odd numbers",
		[]int{1, 2, 3, 4, 5, 6, 7, 8, 9},
		[]int{1, 3, 5, 7, 9},
		func(x int) bool { return x%2 == 1 },
	)
	test(t, slicesx.Filter, "Filter strings starting with 'A'",
		[]string{"Apple", "Banana", "Avocado", "Grapes", "Apricot"},
		[]string{"Apple", "Avocado", "Apricot"},
		func(s string) bool { return s[0] == 'A' },
	)
	test(t, slicesx.Filter, "Filter strings longer than 5 chars",
		[]string{"Apple", "Banana", "Avocado", "Grapes", "Apricot"},
		[]string{"Banana", "Avocado", "Grapes", "Apricot"},
		func(s string) bool { return len(s) > 5 },
	)
}

func Test_Retain(t *testing.T) {
	t.Parallel()
	test(t, slicesx.FilterInPlace, "Filter even numbers",
		[]int{1, 2, 3, 4, 5, 6, 7, 8, 9},
		[]int{2, 4, 6, 8},
		func(x int) bool { return x%2 == 0 },
	)
	test(t, slicesx.FilterInPlace, "Filter odd numbers",
		[]int{1, 2, 3, 4, 5, 6, 7, 8, 9},
		[]int{1, 3, 5, 7, 9},
		func(x int) bool { return x%2 == 1 },
	)
	test(t, slicesx.FilterInPlace, "Filter strings starting with 'A'",
		[]string{"Apple", "Banana", "Avocado", "Grapes", "Apricot"},
		[]string{"Apple", "Avocado", "Apricot"},
		func(s string) bool { return s[0] == 'A' },
	)
	test(t, slicesx.FilterInPlace, "Filter strings longer than 5 chars",
		[]string{"Apple", "Banana", "Avocado", "Grapes", "Apricot"},
		[]string{"Banana", "Avocado", "Grapes", "Apricot"},
		func(s string) bool { return len(s) > 5 },
	)
}

func Benchmark_Filter(b *testing.B) {
	n := 100000

	source := make([]int, n)
	for i := range source {
		source[i] = i
	}

	for b.Loop() {
		e := slicesx.Filter(source, func(x int) bool { return x%2 == 0 })
		require.Len(b, e, n/2)
	}
}

func Benchmark_FilterInPlace(b *testing.B) {
	n := 100000

	source := make([]int, n)
	for i := range source {
		source[i] = i
	}

	// Preallocate all copies before timing
	// because FilterInPlace mutates the original slice
	copies := make([][]int, b.N)
	for i := range b.N {
		buf := make([]int, len(source))
		copy(buf, source)
		copies[i] = buf
	}

	b.ResetTimer()
	for i := range b.N {
		e := slicesx.FilterInPlace(copies[i], func(x int) bool { return x%2 == 0 })
		require.Len(b, e, n/2)
	}
}
