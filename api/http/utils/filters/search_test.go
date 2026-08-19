package filters

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestSearchFn_BasicSearch(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "Alice Smith", Email: "alice@example.com", Age: 25},
		{ID: 2, Name: "Bob Johnson", Email: "bob@company.com", Age: 30},
		{ID: 3, Name: "Charlie Brown", Email: "charlie@test.org", Age: 35},
	}

	accessors := []SearchAccessor[User]{userNameAccessor, userEmailAccessor}
	params := SearchQueryParams{search: "Alice"}

	result := searchFn(users, params, accessors)

	require.Len(t, result, 1)
	require.Equal(t, "Alice Smith", result[0].Name)
}

func TestSearchFn_EmptySearch(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "Alice Smith", Email: "alice@example.com", Age: 25},
		{ID: 2, Name: "Bob Johnson", Email: "bob@company.com", Age: 30},
	}

	accessors := []SearchAccessor[User]{userNameAccessor, userEmailAccessor}
	params := SearchQueryParams{search: ""}

	result := searchFn(users, params, accessors)

	// Should return all items when search is empty
	require.Equal(t, users, result)
}

func TestSearchFn_NoMatches(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "Alice Smith", Email: "alice@example.com", Age: 25},
		{ID: 2, Name: "Bob Johnson", Email: "bob@company.com", Age: 30},
	}

	accessors := []SearchAccessor[User]{userNameAccessor, userEmailAccessor}
	params := SearchQueryParams{search: "nonexistent"}

	result := searchFn(users, params, accessors)

	require.Empty(t, result)
}

func TestSearchFn_MultipleMatches(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "Alice Smith", Email: "alice@example.com", Age: 25},
		{ID: 2, Name: "Bob Smith", Email: "bob@company.com", Age: 30},
		{ID: 3, Name: "Charlie Brown", Email: "charlie@smith.org", Age: 35},
	}

	accessors := []SearchAccessor[User]{userNameAccessor, userEmailAccessor}
	params := SearchQueryParams{search: "Smith"}

	result := searchFn(users, params, accessors)

	require.Len(t, result, 3)
	require.Equal(t, "Alice Smith", result[0].Name)
	require.Equal(t, "Bob Smith", result[1].Name)
	require.Equal(t, "Charlie Brown", result[2].Name) // Matches via email
}

func TestSearchFn_MultipleAccessors(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "Alice Smith", Email: "alice@example.com", Age: 25},
		{ID: 2, Name: "Bob Johnson", Email: "bob@company.com", Age: 30},
		{ID: 3, Name: "Charlie Brown", Email: "charlie@test.org", Age: 35},
	}

	// Search across name, email, and ID
	accessors := []SearchAccessor[User]{userNameAccessor, userEmailAccessor, userIDAccessor}

	// Search by ID
	params := SearchQueryParams{search: "2"}
	result := searchFn(users, params, accessors)
	require.Len(t, result, 1)
	require.Equal(t, 2, result[0].ID)

	// Search by email domain
	params = SearchQueryParams{search: "company.com"}
	result = searchFn(users, params, accessors)
	require.Len(t, result, 1)
	require.Equal(t, "Bob Johnson", result[0].Name)
}

func TestSearchFn_CaseSensitive(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "Alice Smith", Email: "alice@example.com", Age: 25},
		{ID: 2, Name: "Bob Johnson", Email: "bob@company.com", Age: 30},
	}

	accessors := []SearchAccessor[User]{userNameAccessor, userEmailAccessor}

	// Case sensitive search - should not match
	params := SearchQueryParams{search: "alice"}
	result := searchFn(users, params, accessors)
	require.Len(t, result, 1) // Matches email which is lowercase

	// Exact case match
	params = SearchQueryParams{search: "Alice"}
	result = searchFn(users, params, accessors)
	require.Len(t, result, 1)
	require.Equal(t, "Alice Smith", result[0].Name)
}

func TestSearchFn_PartialMatches(t *testing.T) {
	t.Parallel()
	products := []Product{
		{ID: 1, Name: "Wireless Mouse", Description: "Ergonomic wireless mouse", Price: 25, Category: "Electronics"},
		{ID: 2, Name: "Mechanical Keyboard", Description: "RGB gaming keyboard", Price: 150, Category: "Electronics"},
		{ID: 3, Name: "Coffee Mug", Description: "Ceramic coffee mug", Price: 15, Category: "Kitchen"},
	}

	accessors := []SearchAccessor[Product]{productNameAccessor, productDescriptionAccessor}

	// Partial word match
	params := SearchQueryParams{search: "wire"}
	result := searchFn(products, params, accessors)
	require.Len(t, result, 1)
	require.Equal(t, "Wireless Mouse", result[0].Name)

	// Match in description
	params = SearchQueryParams{search: "RGB"}
	result = searchFn(products, params, accessors)
	require.Len(t, result, 1)
	require.Equal(t, "Mechanical Keyboard", result[0].Name)
}

func TestSearchFn_EmptySlice(t *testing.T) {
	t.Parallel()
	users := []User{}
	accessors := []SearchAccessor[User]{userNameAccessor, userEmailAccessor}
	params := SearchQueryParams{search: "anything"}

	result := searchFn(users, params, accessors)

	require.Empty(t, result)
}

func TestSearchFn_EmptyAccessors(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "Alice Smith", Email: "alice@example.com", Age: 25},
	}

	accessors := []SearchAccessor[User]{} // No accessors
	params := SearchQueryParams{search: "Alice"}

	result := searchFn(users, params, accessors)

	// Should return empty since no accessors to search through
	require.Empty(t, result)
}

func TestSearchFn_SingleAccessor(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "Alice Smith", Email: "alice@example.com", Age: 25},
		{ID: 2, Name: "Bob Johnson", Email: "bob@company.com", Age: 30},
	}

	// Only search by name
	accessors := []SearchAccessor[User]{userNameAccessor}
	params := SearchQueryParams{search: "company.com"}

	result := searchFn(users, params, accessors)

	// Should not match since we're only searching names, not emails
	require.Empty(t, result)
}

func TestSearchFn_NumericSearch(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "Alice Smith", Email: "alice@example.com", Age: 25},
		{ID: 2, Name: "Bob Johnson", Email: "bob@company.com", Age: 30},
		{ID: 3, Name: "Charlie Brown", Email: "charlie@test.org", Age: 35},
	}

	// Search by age (converted to string)
	accessors := []SearchAccessor[User]{userAgeAccessor}
	params := SearchQueryParams{search: "30"}

	result := searchFn(users, params, accessors)

	require.Len(t, result, 1)
	require.Equal(t, 30, result[0].Age)
}

func TestSearchFn_FormattedAccessor(t *testing.T) {
	t.Parallel()
	products := []Product{
		{ID: 1, Name: "Mouse", Description: "Wireless mouse", Price: 25, Category: "Electronics"},
		{ID: 2, Name: "Keyboard", Description: "Gaming keyboard", Price: 150, Category: "Electronics"},
	}

	// Search by formatted price (e.g., "$25")
	accessors := []SearchAccessor[Product]{productPriceAccessor}
	params := SearchQueryParams{search: "$25"}

	result := searchFn(products, params, accessors)

	require.Len(t, result, 1)
	require.Equal(t, "Mouse", result[0].Name)
}

func TestSearchFn_FirstMatchOnly(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "test user", Email: "test@example.com", Age: 25},
	}

	// Both accessors would match the search term
	accessors := []SearchAccessor[User]{userNameAccessor, userEmailAccessor}
	params := SearchQueryParams{search: "test"}

	result := searchFn(users, params, accessors)

	// Should only include the item once, even though multiple accessors match
	require.Len(t, result, 1)
	require.Equal(t, "test user", result[0].Name)
}

func TestSearchFn_PreservesOrder(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "Alice Test", Email: "alice@example.com", Age: 25},
		{ID: 2, Name: "Bob Johnson", Email: "bob@test.com", Age: 30},
		{ID: 3, Name: "Charlie Test", Email: "charlie@example.com", Age: 35},
	}

	accessors := []SearchAccessor[User]{userNameAccessor, userEmailAccessor}
	params := SearchQueryParams{search: "Test"}

	result := searchFn(users, params, accessors)

	require.Len(t, result, 3)
	// Should preserve original order
	require.Equal(t, 1, result[0].ID)
	require.Equal(t, 2, result[1].ID)
	require.Equal(t, 3, result[2].ID)
}

func TestSearchFn_ComplexSearch(t *testing.T) {
	t.Parallel()
	products := []Product{
		{ID: 1, Name: "Gaming Mouse", Description: "High-DPI gaming mouse", Price: 75, Category: "Gaming"},
		{ID: 2, Name: "Office Mouse", Description: "Ergonomic office mouse", Price: 25, Category: "Office"},
		{ID: 3, Name: "Gaming Keyboard", Description: "Mechanical gaming keyboard", Price: 150, Category: "Gaming"},
		{ID: 4, Name: "Wireless Headset", Description: "Gaming headset with mic", Price: 100, Category: "Gaming"},
	}

	// Search across multiple fields
	accessors := []SearchAccessor[Product]{
		productNameAccessor,
		productDescriptionAccessor,
		productCategoryAccessor,
	}

	params := SearchQueryParams{search: "Gaming"}

	result := searchFn(products, params, accessors)

	require.Len(t, result, 3)
	require.Equal(t, "Gaming Mouse", result[0].Name)
	require.Equal(t, "Gaming Keyboard", result[1].Name)
	require.Equal(t, "Wireless Headset", result[2].Name)
}

func TestSearchFn_WhitespaceSearch(t *testing.T) {
	t.Parallel()
	users := []User{
		{ID: 1, Name: "Alice Smith", Email: "alice@example.com", Age: 25},
		{ID: 2, Name: "Bob Johnson", Email: "bob@company.com", Age: 30},
	}

	accessors := []SearchAccessor[User]{userNameAccessor, userEmailAccessor}

	// Search with just whitespace should be treated as empty
	params := SearchQueryParams{search: "   "}
	result := searchFn(users, params, accessors)

	require.Len(t, result, 2)
}
