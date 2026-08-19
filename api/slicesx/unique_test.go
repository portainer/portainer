package slicesx_test

import (
	"testing"

	"github.com/portainer/portainer/api/slicesx"
	"github.com/stretchr/testify/assert"
)

func Test_Unique(t *testing.T) {
	t.Parallel()
	is := assert.New(t)
	t.Run("Should extract unique numbers", func(t *testing.T) {

		source := []int{1, 1, 2, 3, 4, 4, 5, 4, 6, 7, 8, 9, 1}
		result := slicesx.Unique(source)
		expected := []int{1, 2, 3, 4, 5, 6, 7, 8, 9}

		is.ElementsMatch(result, expected)
	})

	t.Run("Should return empty array", func(t *testing.T) {
		source := []int{}
		result := slicesx.Unique(source)
		expected := []int{}
		is.ElementsMatch(result, expected)
	})
}

func Test_UniqueBy(t *testing.T) {
	t.Parallel()
	is := assert.New(t)
	t.Run("Should extract unique numbers by property", func(t *testing.T) {

		source := []struct{ int }{{1}, {1}, {2}, {3}, {4}, {4}, {5}, {4}, {6}, {7}, {8}, {9}, {1}}
		result := slicesx.UniqueBy(source, func(item struct{ int }) int { return item.int })
		expected := []struct{ int }{{1}, {2}, {3}, {4}, {5}, {6}, {7}, {8}, {9}}

		is.ElementsMatch(result, expected)
	})

	t.Run("Should return empty array", func(t *testing.T) {
		source := []int{}
		result := slicesx.UniqueBy(source, func(x int) int { return x })
		expected := []int{}
		is.ElementsMatch(result, expected)
	})
}
