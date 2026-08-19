package slicesx

import (
	"strconv"
	"testing"
)

func TestReduce(t *testing.T) {
	t.Run("sum ints", func(t *testing.T) {
		got := Reduce([]int{1, 2, 3, 4}, 0, func(acc, v int) int {
			return acc + v
		})

		want := 10
		if got != want {
			t.Errorf("Reduce() = %v, want %v", got, want)
		}
	})

	t.Run("empty slice returns initial value", func(t *testing.T) {
		got := Reduce([]int{}, 42, func(acc, v int) int {
			return acc + v
		})

		want := 42
		if got != want {
			t.Errorf("Reduce() = %v, want %v", got, want)
		}
	})

	t.Run("single element", func(t *testing.T) {
		got := Reduce([]int{5}, 10, func(acc, v int) int {
			return acc + v
		})

		want := 15
		if got != want {
			t.Errorf("Reduce() = %v, want %v", got, want)
		}
	})

	t.Run("reduce to different type", func(t *testing.T) {
		got := Reduce([]int{1, 2, 3}, "", func(acc string, v int) string {
			return acc + strconv.Itoa(v)
		})

		want := "123"
		if got != want {
			t.Errorf("Reduce() = %q, want %q", got, want)
		}
	})

	t.Run("build slice", func(t *testing.T) {
		got := Reduce([]int{1, 2, 3}, []string{}, func(acc []string, v int) []string {
			return append(acc, strconv.Itoa(v))
		})

		want := []string{"1", "2", "3"}

		if len(got) != len(want) {
			t.Fatalf("Reduce() length = %d, want %d", len(got), len(want))
		}

		for i := range want {
			if got[i] != want[i] {
				t.Errorf("Reduce()[%d] = %q, want %q", i, got[i], want[i])
			}
		}
	})
}
