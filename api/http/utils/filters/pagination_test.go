package filters

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestPaginateFn_BasicPagination(t *testing.T) {
	t.Parallel()
	items := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

	// First page
	params := PaginationQueryParams{start: 0, limit: 3}
	result := paginateFn(items, params)
	require.Equal(t, []int{1, 2, 3}, result)

	// Second page
	params = PaginationQueryParams{start: 3, limit: 3}
	result = paginateFn(items, params)
	require.Equal(t, []int{4, 5, 6}, result)

	// Third page
	params = PaginationQueryParams{start: 6, limit: 3}
	result = paginateFn(items, params)
	require.Equal(t, []int{7, 8, 9}, result)

	// Last partial page
	params = PaginationQueryParams{start: 9, limit: 3}
	result = paginateFn(items, params)
	require.Equal(t, []int{10}, result)
}

func TestPaginateFn_ZeroLimit(t *testing.T) {
	t.Parallel()
	items := []int{1, 2, 3, 4, 5}

	params := PaginationQueryParams{start: 2, limit: 0}
	result := paginateFn(items, params)

	// Should return all items when limit is 0
	require.Equal(t, items, result)
}

func TestPaginateFn_NegativeLimit(t *testing.T) {
	t.Parallel()
	items := []int{1, 2, 3, 4, 5}

	params := PaginationQueryParams{start: 2, limit: -5}
	result := paginateFn(items, params)

	// Should return all items when limit is negative
	require.Equal(t, items, result)
}

func TestPaginateFn_NegativeStart(t *testing.T) {
	t.Parallel()
	items := []int{1, 2, 3, 4, 5}

	params := PaginationQueryParams{start: -3, limit: 2}
	result := paginateFn(items, params)

	// Should start from index 0 when start is negative
	require.Equal(t, []int{1, 2}, result)
}

func TestPaginateFn_StartBeyondLength(t *testing.T) {
	t.Parallel()
	items := []int{1, 2, 3, 4, 5}

	params := PaginationQueryParams{start: 10, limit: 3}
	result := paginateFn(items, params)

	// Should return empty slice when start is beyond length
	require.Empty(t, result)
}

func TestPaginateFn_StartAtLength(t *testing.T) {
	t.Parallel()
	items := []int{1, 2, 3, 4, 5}

	params := PaginationQueryParams{start: 5, limit: 3}
	result := paginateFn(items, params)

	// Should return empty slice when start equals length
	require.Empty(t, result)
}

func TestPaginateFn_LimitLargerThanRemaining(t *testing.T) {
	t.Parallel()
	items := []int{1, 2, 3, 4, 5}

	params := PaginationQueryParams{start: 3, limit: 10}
	result := paginateFn(items, params)

	// Should return remaining items when limit exceeds available items
	require.Equal(t, []int{4, 5}, result)
}

func TestPaginateFn_EmptySlice(t *testing.T) {
	t.Parallel()
	items := []int{}

	params := PaginationQueryParams{start: 0, limit: 5}
	result := paginateFn(items, params)

	// Should return empty slice
	require.Empty(t, result)
}

func TestPaginateFn_EmptySliceWithNegativeStart(t *testing.T) {
	t.Parallel()
	items := []int{}

	params := PaginationQueryParams{start: -5, limit: 3}
	result := paginateFn(items, params)

	// Should return empty slice
	require.Empty(t, result)
}

func TestPaginateFn_SingleElement(t *testing.T) {
	t.Parallel()
	items := []int{42}

	// Take the single element
	params := PaginationQueryParams{start: 0, limit: 1}
	result := paginateFn(items, params)
	require.Equal(t, []int{42}, result)

	// Start beyond the single element
	params = PaginationQueryParams{start: 1, limit: 1}
	result = paginateFn(items, params)
	require.Empty(t, result)
}

func TestPaginateFn_LimitOfOne(t *testing.T) {
	t.Parallel()
	items := []int{1, 2, 3, 4, 5}

	results := [][]int{}
	for i := range items {
		params := PaginationQueryParams{start: i, limit: 1}
		result := paginateFn(items, params)
		results = append(results, result)
	}

	expected := [][]int{
		{1}, {2}, {3}, {4}, {5},
	}
	require.Equal(t, expected, results)
}

func TestPaginateFn_StringSlice(t *testing.T) {
	t.Parallel()
	items := []string{"apple", "banana", "cherry", "date", "elderberry"}

	params := PaginationQueryParams{start: 1, limit: 3}
	result := paginateFn(items, params)

	require.Equal(t, []string{"banana", "cherry", "date"}, result)
}

func TestPaginateFn_StructSlice(t *testing.T) {
	t.Parallel()
	type User struct {
		ID   int
		Name string
	}

	users := []User{
		{ID: 1, Name: "Alice"},
		{ID: 2, Name: "Bob"},
		{ID: 3, Name: "Charlie"},
		{ID: 4, Name: "David"},
	}

	params := PaginationQueryParams{start: 1, limit: 2}
	result := paginateFn(users, params)

	expected := []User{
		{ID: 2, Name: "Bob"},
		{ID: 3, Name: "Charlie"},
	}
	require.Equal(t, expected, result)
}

func TestPaginateFn_BoundaryConditions(t *testing.T) {
	t.Parallel()
	items := []int{1, 2, 3, 4, 5}

	testCases := []struct {
		name     string
		start    int
		limit    int
		expected []int
	}{
		{"start=0, limit=0", 0, 0, []int{1, 2, 3, 4, 5}},
		{"start=0, limit=5", 0, 5, []int{1, 2, 3, 4, 5}},
		{"start=0, limit=6", 0, 6, []int{1, 2, 3, 4, 5}},
		{"start=4, limit=1", 4, 1, []int{5}},
		{"start=4, limit=2", 4, 2, []int{5}},
		{"start=5, limit=1", 5, 1, []int{}},
		{"start=-1, limit=1", -1, 1, []int{1}},
		{"start=-10, limit=3", -10, 3, []int{1, 2, 3}},
		{"start=100, limit=1", 100, 1, []int{}},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			params := PaginationQueryParams{start: tc.start, limit: tc.limit}
			result := paginateFn(items, params)
			require.Equal(t, tc.expected, result)
		})
	}
}

func TestPaginateFn_ReturnsSliceView(t *testing.T) {
	t.Parallel()
	items := []int{1, 2, 3, 4, 5}

	params := PaginationQueryParams{start: 1, limit: 3}
	result := paginateFn(items, params)

	// Result should be a slice view of the original
	require.Equal(t, []int{2, 3, 4}, result)

	// Modifying result WILL affect the original slice (shares underlying array)
	if len(result) > 0 {
		result[0] = 999
		require.Equal(t, 999, items[1]) // Original is modified because they share memory
	}
}

func TestPaginateFn_TypicalAPIUseCases(t *testing.T) {
	t.Parallel()
	// Simulate API responses with different page sizes
	items := make([]int, 100)
	for i := range items {
		items[i] = i + 1
	}

	// Page size 10
	params := PaginationQueryParams{start: 0, limit: 10}
	page1 := paginateFn(items, params)
	require.Len(t, page1, 10)
	require.Equal(t, []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}, page1)

	// Page size 20, offset 20
	params = PaginationQueryParams{start: 20, limit: 20}
	page2 := paginateFn(items, params)
	require.Len(t, page2, 20)
	require.Equal(t, 21, page2[0])
	require.Equal(t, 40, page2[19])

	// Last page (partial)
	params = PaginationQueryParams{start: 95, limit: 10}
	lastPage := paginateFn(items, params)
	require.Len(t, lastPage, 5)
	require.Equal(t, []int{96, 97, 98, 99, 100}, lastPage)
}
