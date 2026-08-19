package slicesx_test

import (
	"reflect"
	"testing"

	"github.com/stretchr/testify/assert"
)

type libFunc[T, U, V any] func([]T, func(T) U) V
type predicateFunc[T, U any] func(T) U

func test[T, U, V any](t *testing.T, libFn libFunc[T, U, V], name string, input []T, expected V, predicate predicateFunc[T, U]) {
	t.Helper()

	t.Run(name, func(t *testing.T) {
		is := assert.New(t)

		result := libFn(input, predicate)

		switch reflect.TypeOf(result).Kind() {
		case reflect.Slice, reflect.Array:
			is.Equal(expected, result)
			is.ElementsMatch(expected, result)
		default:
			is.Equal(expected, result)
		}
	})
}
