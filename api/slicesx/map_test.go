package slicesx_test

import (
	"strconv"
	"testing"

	"github.com/portainer/portainer/api/slicesx"
)

func Test_Map(t *testing.T) {
	t.Parallel()
	test(t, slicesx.Map, "Map integers to strings",
		[]int{1, 2, 3, 4, 5},
		[]string{"1", "2", "3", "4", "5"},
		strconv.Itoa,
	)
	test(t, slicesx.Map, "Map strings to integers",
		[]string{"1", "2", "3", "4", "5"},
		[]int{1, 2, 3, 4, 5},
		func(s string) int {
			n, _ := strconv.Atoi(s)
			return n
		},
	)
}

func Test_FlatMap(t *testing.T) {
	t.Parallel()
	test(t, slicesx.FlatMap, "Map integers to strings and flatten",
		[]int{1, 2, 3, 4, 5},
		[]string{"1", "1", "2", "2", "3", "3", "4", "4", "5", "5"},
		func(i int) []string {
			x := strconv.Itoa(i)
			return []string{x, x}
		},
	)
	test(t, slicesx.FlatMap, "Map strings to integers and flatten",
		[]string{"1", "2", "3", "4", "5"},
		[]int{1, 1, 2, 2, 3, 3, 4, 4, 5, 5},
		func(s string) []int {
			n, _ := strconv.Atoi(s)
			return []int{n, n}
		},
	)
}
