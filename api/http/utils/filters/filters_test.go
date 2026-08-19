package filters

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// Helper functions for creating test data
func createUsers() []User {
	return []User{
		{ID: 1, Name: "Alice Johnson", Email: "alice@example.com", Age: 25},
		{ID: 2, Name: "Bob Smith", Email: "bob@example.com", Age: 30},
		{ID: 3, Name: "Charlie Brown", Email: "charlie@example.com", Age: 35},
		{ID: 4, Name: "Diana Prince", Email: "diana@example.com", Age: 28},
		{ID: 5, Name: "Eve Adams", Email: "eve@example.com", Age: 22},
	}
}

func createProducts() []Product {
	return []Product{
		{ID: 1, Name: "Laptop", Description: "High-performance laptop", Price: 999, Category: "Electronics"},
		{ID: 2, Name: "Mouse", Description: "Wireless mouse", Price: 29, Category: "Electronics"},
		{ID: 3, Name: "Book", Description: "Programming book", Price: 49, Category: "Books"},
		{ID: 4, Name: "Keyboard", Description: "Mechanical keyboard", Price: 129, Category: "Electronics"},
		{ID: 5, Name: "Chair", Description: "Office chair", Price: 199, Category: "Furniture"},
	}
}

// Sort functions
func userNameSort(a, b User) int {
	return strings.Compare(a.Name, b.Name)
}

func userAgeSort(a, b User) int {
	return a.Age - b.Age
}

func productPriceSort(a, b Product) int {
	if a.Price < b.Price {
		return -1
	}
	if a.Price > b.Price {
		return 1
	}
	return 0
}

func productNameSort(a, b Product) int {
	return strings.Compare(a.Name, b.Name)
}

func TestSearchOrderAndPaginate(t *testing.T) {
	t.Parallel()
	users := createUsers()
	products := createProducts()

	userConfig := Config[User]{
		SearchAccessors: []SearchAccessor[User]{userNameAccessor, userEmailAccessor},
		SortBindings: []SortBinding[User]{
			{Key: "name", Fn: userNameSort},
			{Key: "age", Fn: userAgeSort},
		},
	}

	productConfig := Config[Product]{
		SearchAccessors: []SearchAccessor[Product]{productNameAccessor, productDescriptionAccessor, productCategoryAccessor},
		SortBindings: []SortBinding[Product]{
			{Key: "price", Fn: productPriceSort},
			{Key: "name", Fn: productNameSort},
		},
	}

	t.Run("no filters applied", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: ""},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 5, "Should return all items when no filters applied")
		require.Equal(t, 5, result.TotalCount, "TotalCount should equal filtered items")
		require.Equal(t, 5, result.TotalAvailable, "TotalAvailable should equal original items")
		require.Equal(t, users, result.Items, "Items should be unchanged")
	})

	t.Run("search only", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: "alice"},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 1, "Should find one user matching 'alice'")
		require.Equal(t, 1, result.TotalCount, "TotalCount should reflect filtered items")
		require.Equal(t, 5, result.TotalAvailable, "TotalAvailable should be original count")
		require.Equal(t, "Alice Johnson", result.Items[0].Name, "Should return Alice")
	})

	t.Run("search case insensitive", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: "ALICE"},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 1, "Search should be case insensitive")
		require.Equal(t, "Alice Johnson", result.Items[0].Name, "Should return Alice")
	})

	t.Run("search by email", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: "bob@example"},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 1, "Should find user by email")
		require.Equal(t, "Bob Smith", result.Items[0].Name, "Should return Bob")
	})

	t.Run("search no matches", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: "nonexistent"},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Empty(t, result.Items, "Should return empty when no matches")
		require.Equal(t, 0, result.TotalCount, "TotalCount should be 0")
		require.Equal(t, 5, result.TotalAvailable, "TotalAvailable should remain original count")
	})

	t.Run("search with whitespace", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: "  alice  "},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 1, "Should trim whitespace from search")
		require.Equal(t, "Alice Johnson", result.Items[0].Name, "Should return Alice")
	})

	t.Run("sort ascending", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: ""},
			SortQueryParams:       SortQueryParams{sort: "name", order: SortAsc},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 5, "Should return all items")
		require.Equal(t, "Alice Johnson", result.Items[0].Name, "First should be Alice")
		require.Equal(t, "Eve Adams", result.Items[4].Name, "Last should be Eve")
	})

	t.Run("sort descending", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: ""},
			SortQueryParams:       SortQueryParams{sort: "name", order: SortDesc},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 5, "Should return all items")
		require.Equal(t, "Eve Adams", result.Items[0].Name, "First should be Eve (desc order)")
		require.Equal(t, "Alice Johnson", result.Items[4].Name, "Last should be Alice (desc order)")
	})

	t.Run("sort by age", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: ""},
			SortQueryParams:       SortQueryParams{sort: "age", order: SortAsc},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 5, "Should return all items")
		require.Equal(t, 22, result.Items[0].Age, "First should be youngest (22)")
		require.Equal(t, 35, result.Items[4].Age, "Last should be oldest (35)")
	})

	t.Run("sort invalid key", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: ""},
			SortQueryParams:       SortQueryParams{sort: "invalid", order: SortAsc},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 5, "Should return all items")
		// Items should remain in original order since no valid sort key
		require.Equal(t, users, result.Items, "Should maintain original order with invalid sort key")
	})

	t.Run("pagination basic", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: ""},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: 1, limit: 2},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 2, "Should return 2 items")
		require.Equal(t, 5, result.TotalCount, "TotalCount should be all items")
		require.Equal(t, 5, result.TotalAvailable, "TotalAvailable should be original count")
		require.Equal(t, users[1], result.Items[0], "Should start from index 1")
		require.Equal(t, users[2], result.Items[1], "Should include index 2")
	})

	t.Run("pagination zero limit", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: ""},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: 1, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 5, "Should return all items when limit is 0")
		require.Equal(t, users, result.Items, "Should return all original items")
	})

	t.Run("pagination negative limit", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: ""},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: 1, limit: -1},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 5, "Should return all items when limit is negative")
	})

	t.Run("pagination start beyond length", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: ""},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: 10, limit: 2},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Empty(t, result.Items, "Should return empty slice when start is beyond length")
		require.Equal(t, 5, result.TotalCount, "TotalCount should still be original count")
	})

	t.Run("pagination negative start", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: ""},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: -1, limit: 2},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		require.Len(t, result.Items, 2, "Should return 2 items starting from 0")
		require.Equal(t, users[0], result.Items[0], "Should start from index 0")
		require.Equal(t, users[1], result.Items[1], "Should include index 1")
	})

	t.Run("combined search sort and pagination", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: "example.com"},
			SortQueryParams:       SortQueryParams{sort: "age", order: SortAsc},
			PaginationQueryParams: PaginationQueryParams{start: 1, limit: 2},
		}

		result := SearchOrderAndPaginate(users, params, userConfig)

		// All users have "example.com" in email, so all 5 should match search
		// Then sorted by age: Eve(22), Alice(25), Diana(28), Bob(30), Charlie(35)
		// Then paginated: start=1, limit=2 should give Alice(25), Diana(28)
		require.Len(t, result.Items, 2, "Should return 2 items after pagination")
		require.Equal(t, 5, result.TotalCount, "TotalCount should be all filtered items")
		require.Equal(t, 5, result.TotalAvailable, "TotalAvailable should be original count")
		require.Equal(t, 25, result.Items[0].Age, "First item should be Alice (age 25)")
		require.Equal(t, 28, result.Items[1].Age, "Second item should be Diana (age 28)")
	})

	t.Run("products test", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: "electronics"},
			SortQueryParams:       SortQueryParams{sort: "price", order: SortAsc},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 2},
		}

		result := SearchOrderAndPaginate(products, params, productConfig)

		// Should find 3 electronics, sorted by price: Mouse(29.99), Keyboard(129.99), Laptop(999.99)
		// Paginated to first 2: Mouse, Keyboard
		require.Len(t, result.Items, 2, "Should return 2 items")
		require.Equal(t, 3, result.TotalCount, "Should find 3 electronics items")
		require.Equal(t, 5, result.TotalAvailable, "Should have 5 total products")
		require.Equal(t, "Mouse", result.Items[0].Name, "First should be Mouse (cheapest)")
		require.Equal(t, "Keyboard", result.Items[1].Name, "Second should be Keyboard")
	})

	t.Run("empty input slice", func(t *testing.T) {
		emptyUsers := []User{}
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: "test"},
			SortQueryParams:       SortQueryParams{sort: "name", order: SortAsc},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 10},
		}

		result := SearchOrderAndPaginate(emptyUsers, params, userConfig)

		require.Empty(t, result.Items, "Should return empty slice")
		require.Equal(t, 0, result.TotalCount, "TotalCount should be 0")
		require.Equal(t, 0, result.TotalAvailable, "TotalAvailable should be 0")
	})
}

func TestSearchOrderAndPaginateWithErrors(t *testing.T) {
	t.Parallel()
	users := createUsers()

	// Config with error-prone accessor
	errorConfig := Config[User]{
		SearchAccessors: []SearchAccessor[User]{errorAccessor[User], userNameAccessor},
		SortBindings: []SortBinding[User]{
			{Key: "name", Fn: userNameSort},
		},
	}

	t.Run("search with accessor errors", func(t *testing.T) {
		params := QueryParams{
			SearchQueryParams:     SearchQueryParams{search: "alice"},
			SortQueryParams:       SortQueryParams{sort: "", order: ""},
			PaginationQueryParams: PaginationQueryParams{start: 0, limit: 0},
		}

		result := SearchOrderAndPaginate(users, params, errorConfig)

		// Should still find Alice through the working accessor
		require.Len(t, result.Items, 1, "Should find user despite error in first accessor")
		require.Equal(t, "Alice Johnson", result.Items[0].Name, "Should return Alice")
	})
}

func TestApplyFilterResultsHeaders(t *testing.T) {
	t.Parallel()
	t.Run("sets headers correctly", func(t *testing.T) {
		w := httptest.NewRecorder()
		var responseWriter http.ResponseWriter = w
		result := FilterResult[User]{
			Items:          createUsers()[:3],
			TotalCount:     10,
			TotalAvailable: 25,
		}

		ApplyFilterResultsHeaders(&responseWriter, result)

		require.Equal(t, "10", w.Header().Get("X-Total-Count"), "Should set X-Total-Count header")
		require.Equal(t, "25", w.Header().Get("X-Total-Available"), "Should set X-Total-Available header")
	})

	t.Run("sets headers with zero values", func(t *testing.T) {
		w := httptest.NewRecorder()
		var responseWriter http.ResponseWriter = w
		result := FilterResult[User]{
			Items:          []User{},
			TotalCount:     0,
			TotalAvailable: 0,
		}

		ApplyFilterResultsHeaders(&responseWriter, result)

		require.Equal(t, "0", w.Header().Get("X-Total-Count"), "Should set X-Total-Count to 0")
		require.Equal(t, "0", w.Header().Get("X-Total-Available"), "Should set X-Total-Available to 0")
	})

	t.Run("overwrites existing headers", func(t *testing.T) {
		w := httptest.NewRecorder()
		var responseWriter http.ResponseWriter = w
		w.Header().Set("X-Total-Count", "999")
		w.Header().Set("X-Total-Available", "999")

		result := FilterResult[User]{
			Items:          createUsers()[:2],
			TotalCount:     5,
			TotalAvailable: 15,
		}

		ApplyFilterResultsHeaders(&responseWriter, result)

		require.Equal(t, "5", w.Header().Get("X-Total-Count"), "Should overwrite existing X-Total-Count")
		require.Equal(t, "15", w.Header().Get("X-Total-Available"), "Should overwrite existing X-Total-Available")
	})

	t.Run("simulates real handler usage", func(t *testing.T) {
		// Simulate how it's actually used in handlers
		handler := func(w http.ResponseWriter, r *http.Request) {
			result := FilterResult[Product]{
				Items:          createProducts(),
				TotalCount:     5,
				TotalAvailable: 10,
			}
			ApplyFilterResultsHeaders(&w, result)
		}

		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/test", nil)

		handler(w, req)

		require.Equal(t, "5", w.Header().Get("X-Total-Count"), "Should work in handler context")
		require.Equal(t, "10", w.Header().Get("X-Total-Available"), "Should work in handler context")
	})
}

// Benchmark tests
func BenchmarkSearchOrderAndPaginate(b *testing.B) {
	users := createUsers()
	config := Config[User]{
		SearchAccessors: []SearchAccessor[User]{userNameAccessor, userEmailAccessor},
		SortBindings: []SortBinding[User]{
			{Key: "name", Fn: userNameSort},
			{Key: "age", Fn: userAgeSort},
		},
	}
	params := QueryParams{
		SearchQueryParams:     SearchQueryParams{search: "example"},
		SortQueryParams:       SortQueryParams{sort: "name", order: SortAsc},
		PaginationQueryParams: PaginationQueryParams{start: 0, limit: 10},
	}

	for b.Loop() {
		SearchOrderAndPaginate(users, params, config)
	}
}

func BenchmarkApplyFilterResultsHeaders(b *testing.B) {
	w := httptest.NewRecorder()
	var responseWriter http.ResponseWriter = w
	result := FilterResult[User]{
		Items:          createUsers(),
		TotalCount:     100,
		TotalAvailable: 500,
	}

	for b.Loop() {
		ApplyFilterResultsHeaders(&responseWriter, result)
	}
}
