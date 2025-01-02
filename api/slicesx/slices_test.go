package slicesx

import (
	"strconv"
	"testing"

	"github.com/stretchr/testify/assert"
)

type filterTestCase[T any] struct {
	name      string
	input     []T
	expected  []T
	predicate func(T) bool
}

func TestFilter(t *testing.T) {
	intTestCases := []filterTestCase[int]{
		{
			name:     "Filter even numbers",
			input:    []int{1, 2, 3, 4, 5, 6, 7, 8, 9},
			expected: []int{2, 4, 6, 8},

			predicate: func(n int) bool {
				return n%2 == 0
			},
		},
		{
			name:     "Filter odd numbers",
			input:    []int{1, 2, 3, 4, 5, 6, 7, 8, 9},
			expected: []int{1, 3, 5, 7, 9},

			predicate: func(n int) bool {
				return n%2 != 0
			},
		},
	}

	runTestCases(t, intTestCases)

	stringTestCases := []filterTestCase[string]{
		{
			name:     "Filter strings starting with 'A'",
			input:    []string{"Apple", "Banana", "Avocado", "Grapes", "Apricot"},
			expected: []string{"Apple", "Avocado", "Apricot"},
			predicate: func(s string) bool {
				return s[0] == 'A'
			},
		},
		{
			name:     "Filter strings longer than 5 characters",
			input:    []string{"Apple", "Banana", "Avocado", "Grapes", "Apricot"},
			expected: []string{"Banana", "Avocado", "Grapes", "Apricot"},
			predicate: func(s string) bool {
				return len(s) > 5
			},
		},
	}

	runTestCases(t, stringTestCases)
}

func runTestCases[T any](t *testing.T, testCases []filterTestCase[T]) {
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			is := assert.New(t)
			result := Filter(testCase.input, testCase.predicate)

			is.Equal(len(testCase.expected), len(result))
			is.ElementsMatch(testCase.expected, result)
		})
	}
}

func TestMap(t *testing.T) {
	intTestCases := []struct {
		name     string
		input    []int
		expected []string
		mapper   func(int) string
	}{
		{
			name:     "Map integers to strings",
			input:    []int{1, 2, 3, 4, 5},
			expected: []string{"1", "2", "3", "4", "5"},
			mapper:   strconv.Itoa,
		},
	}

	runMapTestCases(t, intTestCases)

	stringTestCases := []struct {
		name     string
		input    []string
		expected []int
		mapper   func(string) int
	}{
		{
			name:     "Map strings to integers",
			input:    []string{"1", "2", "3", "4", "5"},
			expected: []int{1, 2, 3, 4, 5},
			mapper: func(s string) int {
				n, _ := strconv.Atoi(s)
				return n
			},
		},
	}

	runMapTestCases(t, stringTestCases)
}

func runMapTestCases[T, U any](t *testing.T, testCases []struct {
	name     string
	input    []T
	expected []U
	mapper   func(T) U
}) {
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			is := assert.New(t)
			result := Map(testCase.input, testCase.mapper)

			is.Equal(len(testCase.expected), len(result))
			is.ElementsMatch(testCase.expected, result)
		})
	}
}
