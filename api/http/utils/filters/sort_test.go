package filters

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// Helper sort functions
func compareUserByName(a, b User) int {
	return strings.Compare(a.Name, b.Name)
}

func compareUserByAge(a, b User) int {
	return a.Age - b.Age
}

func compareProductByName(a, b Product) int {
	return strings.Compare(a.Name, b.Name)
}

func compareProductByPrice(a, b Product) int {
	return a.Price - b.Price
}

func TestSortFn_BasicAscending(t *testing.T) {
	t.Parallel()
	users := []User{
		{Name: "Charlie", Age: 25},
		{Name: "Alice", Age: 30},
		{Name: "Bob", Age: 20},
	}

	sorts := []SortBinding[User]{
		{Key: "name", Fn: compareUserByName},
		{Key: "age", Fn: compareUserByAge},
	}

	params := SortQueryParams{sort: "name", order: SortAsc}
	result := sortFn(users, params, sorts)

	require.Equal(t, []User{
		{Name: "Alice", Age: 30},
		{Name: "Bob", Age: 20},
		{Name: "Charlie", Age: 25},
	}, result)
}

func TestSortFn_BasicDescending(t *testing.T) {
	t.Parallel()
	users := []User{
		{Name: "Charlie", Age: 25},
		{Name: "Alice", Age: 30},
		{Name: "Bob", Age: 20},
	}

	sorts := []SortBinding[User]{
		{Key: "name", Fn: compareUserByName},
		{Key: "age", Fn: compareUserByAge},
	}

	params := SortQueryParams{sort: "name", order: SortDesc}
	result := sortFn(users, params, sorts)

	require.Equal(t, []User{
		{Name: "Charlie", Age: 25},
		{Name: "Bob", Age: 20},
		{Name: "Alice", Age: 30},
	}, result)
}

func TestSortFn_SortByAge(t *testing.T) {
	t.Parallel()
	users := []User{
		{Name: "Charlie", Age: 25},
		{Name: "Alice", Age: 30},
		{Name: "Bob", Age: 20},
	}

	sorts := []SortBinding[User]{
		{Key: "name", Fn: compareUserByName},
		{Key: "age", Fn: compareUserByAge},
	}

	// Test ascending by age
	params := SortQueryParams{sort: "age", order: SortAsc}
	result := sortFn(users, params, sorts)

	require.Equal(t, []User{
		{Name: "Bob", Age: 20},
		{Name: "Charlie", Age: 25},
		{Name: "Alice", Age: 30},
	}, result)

	// Test descending by age
	params = SortQueryParams{sort: "age", order: SortDesc}
	result = sortFn(users, params, sorts)

	require.Equal(t, []User{
		{Name: "Alice", Age: 30},
		{Name: "Charlie", Age: 25},
		{Name: "Bob", Age: 20},
	}, result)
}

func TestSortFn_UnknownSortKey(t *testing.T) {
	t.Parallel()
	users := []User{
		{Name: "Charlie", Age: 25},
		{Name: "Alice", Age: 30},
		{Name: "Bob", Age: 20},
	}

	sorts := []SortBinding[User]{
		{Key: "name", Fn: compareUserByName},
	}

	params := SortQueryParams{sort: "unknown", order: SortAsc}
	result := sortFn(users, params, sorts)

	// Should return original slice unchanged
	require.Equal(t, []User{
		{Name: "Charlie", Age: 25},
		{Name: "Alice", Age: 30},
		{Name: "Bob", Age: 20},
	}, result)
}

func TestSortFn_EmptySlice(t *testing.T) {
	t.Parallel()
	users := []User{}

	sorts := []SortBinding[User]{
		{Key: "name", Fn: compareUserByName},
	}

	params := SortQueryParams{sort: "name", order: SortAsc}
	result := sortFn(users, params, sorts)

	require.Empty(t, result)
}

func TestSortFn_SingleElement(t *testing.T) {
	t.Parallel()
	users := []User{{Name: "Alice", Age: 30}}

	sorts := []SortBinding[User]{
		{Key: "name", Fn: compareUserByName},
	}

	params := SortQueryParams{sort: "name", order: SortAsc}
	result := sortFn(users, params, sorts)

	require.Equal(t, []User{{Name: "Alice", Age: 30}}, result)
}

func TestSortFn_EmptySortBindings(t *testing.T) {
	t.Parallel()
	users := []User{
		{Name: "Charlie", Age: 25},
		{Name: "Alice", Age: 30},
	}

	sorts := []SortBinding[User]{} // Empty sorts

	params := SortQueryParams{sort: "name", order: SortAsc}
	result := sortFn(users, params, sorts)

	// Should return original slice unchanged
	require.Equal(t, []User{
		{Name: "Charlie", Age: 25},
		{Name: "Alice", Age: 30},
	}, result)
}

func TestSortFn_DifferentType(t *testing.T) {
	t.Parallel()
	products := []Product{
		{Name: "Laptop", Price: 1000},
		{Name: "Mouse", Price: 25},
		{Name: "Keyboard", Price: 100},
	}

	sorts := []SortBinding[Product]{
		{Key: "name", Fn: compareProductByName},
		{Key: "price", Fn: compareProductByPrice},
	}

	// Test by price ascending
	params := SortQueryParams{sort: "price", order: SortAsc}
	result := sortFn(products, params, sorts)

	require.Equal(t, []Product{
		{Name: "Mouse", Price: 25},
		{Name: "Keyboard", Price: 100},
		{Name: "Laptop", Price: 1000},
	}, result)

	// Test by name descending
	params = SortQueryParams{sort: "name", order: SortDesc}
	result = sortFn(products, params, sorts)

	require.Equal(t, []Product{
		{Name: "Mouse", Price: 25},
		{Name: "Laptop", Price: 1000},
		{Name: "Keyboard", Price: 100},
	}, result)
}

func TestSortFn_StableSort(t *testing.T) {
	t.Parallel()
	// Test that sorting is stable (maintains relative order of equal elements)
	users := []User{
		{Name: "Alice", Age: 25},
		{Name: "Bob", Age: 25},
		{Name: "Charlie", Age: 25},
		{Name: "David", Age: 30},
	}

	sorts := []SortBinding[User]{
		{Key: "age", Fn: compareUserByAge},
	}

	params := SortQueryParams{sort: "age", order: SortAsc}
	result := sortFn(users, params, sorts)

	// All users with age 25 should maintain their original relative order
	require.Equal(t, []User{
		{Name: "Alice", Age: 25},
		{Name: "Bob", Age: 25},
		{Name: "Charlie", Age: 25},
		{Name: "David", Age: 30},
	}, result)
}

func TestReverseSortFn(t *testing.T) {
	t.Parallel()
	originalFn := compareUserByAge
	reversedFn := reverSortFn(originalFn)

	userA := User{Name: "Alice", Age: 20}
	userB := User{Name: "Bob", Age: 30}

	// Original function: A < B (returns negative)
	require.Negative(t, originalFn(userA, userB))

	// Reversed function: A > B (returns positive)
	require.Positive(t, reversedFn(userA, userB))

	// Test symmetry
	require.Equal(t, -originalFn(userA, userB), reversedFn(userA, userB))
	require.Equal(t, -originalFn(userB, userA), reversedFn(userB, userA))
}

func TestSortFn_CaseSensitive(t *testing.T) {
	t.Parallel()
	users := []User{
		{Name: "alice", Age: 25},
		{Name: "Bob", Age: 30},
		{Name: "Charlie", Age: 20},
	}

	sorts := []SortBinding[User]{
		{Key: "name", Fn: compareUserByName},
	}

	params := SortQueryParams{sort: "name", order: SortAsc}
	result := sortFn(users, params, sorts)

	// strings.Compare is case-sensitive, uppercase comes before lowercase
	require.Equal(t, []User{
		{Name: "Bob", Age: 30},
		{Name: "Charlie", Age: 20},
		{Name: "alice", Age: 25},
	}, result)
}

func TestSortFn_ModifiesOriginalSlice(t *testing.T) {
	t.Parallel()
	users := []User{
		{Name: "Charlie", Age: 25},
		{Name: "Alice", Age: 30},
		{Name: "Bob", Age: 20},
	}
	original := make([]User, len(users))
	copy(original, users)

	sorts := []SortBinding[User]{
		{Key: "name", Fn: compareUserByName},
	}

	params := SortQueryParams{sort: "name", order: SortAsc}
	result := sortFn(users, params, sorts)

	// The function modifies the original slice
	require.Equal(t, result, users)
	require.NotEqual(t, original, users)
}
