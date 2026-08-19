package slicesx_test

import (
	"testing"

	"github.com/portainer/portainer/api/slicesx"
	"github.com/stretchr/testify/assert"
)

func Test_Flatten(t *testing.T) {
	t.Parallel()
	t.Run("Flatten an array of arrays", func(t *testing.T) {
		is := assert.New(t)

		source := [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}
		expected := []int{1, 2, 3, 4, 5, 6, 7, 8, 9}
		is.ElementsMatch(slicesx.Flatten(source), expected)

	})
}
