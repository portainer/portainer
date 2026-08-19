package filters

import (
	"net/http"
	"net/url"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestExtractListModifiersQueryParams(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name           string
		queryParams    map[string]string
		expectedResult QueryParams
		description    string
	}{
		{
			name: "all parameters provided",
			queryParams: map[string]string{
				"search": "test query",
				"sort":   "name",
				"order":  "asc",
				"start":  "10",
				"limit":  "25",
			},
			expectedResult: QueryParams{
				SearchQueryParams: SearchQueryParams{
					search: "test query",
				},
				SortQueryParams: SortQueryParams{
					sort:  "name",
					order: SortAsc,
				},
				PaginationQueryParams: PaginationQueryParams{
					start: 10,
					limit: 25,
				},
			},
			description: "Should correctly parse all query parameters when provided",
		},
		{
			name: "descending sort order",
			queryParams: map[string]string{
				"search": "another test",
				"sort":   "date",
				"order":  "desc",
				"start":  "0",
				"limit":  "50",
			},
			expectedResult: QueryParams{
				SearchQueryParams: SearchQueryParams{
					search: "another test",
				},
				SortQueryParams: SortQueryParams{
					sort:  "date",
					order: SortDesc,
				},
				PaginationQueryParams: PaginationQueryParams{
					start: 0,
					limit: 50,
				},
			},
			description: "Should correctly handle descending sort order",
		},
		{
			name:        "no parameters provided",
			queryParams: map[string]string{},
			expectedResult: QueryParams{
				SearchQueryParams: SearchQueryParams{
					search: "",
				},
				SortQueryParams: SortQueryParams{
					sort:  "",
					order: SortOrder(""),
				},
				PaginationQueryParams: PaginationQueryParams{
					start: 0,
					limit: 0,
				},
			},
			description: "Should return zero values when no parameters are provided",
		},
		{
			name: "partial parameters - search only",
			queryParams: map[string]string{
				"search": "partial test",
			},
			expectedResult: QueryParams{
				SearchQueryParams: SearchQueryParams{
					search: "partial test",
				},
				SortQueryParams: SortQueryParams{
					sort:  "",
					order: SortOrder(""),
				},
				PaginationQueryParams: PaginationQueryParams{
					start: 0,
					limit: 0,
				},
			},
			description: "Should handle partial parameters correctly",
		},
		{
			name: "partial parameters - pagination only",
			queryParams: map[string]string{
				"start": "5",
				"limit": "15",
			},
			expectedResult: QueryParams{
				SearchQueryParams: SearchQueryParams{
					search: "",
				},
				SortQueryParams: SortQueryParams{
					sort:  "",
					order: SortOrder(""),
				},
				PaginationQueryParams: PaginationQueryParams{
					start: 5,
					limit: 15,
				},
			},
			description: "Should handle pagination parameters when other params are missing",
		},
		{
			name: "invalid sort order",
			queryParams: map[string]string{
				"search": "test",
				"sort":   "name",
				"order":  "invalid",
				"start":  "0",
				"limit":  "10",
			},
			expectedResult: QueryParams{
				SearchQueryParams: SearchQueryParams{
					search: "test",
				},
				SortQueryParams: SortQueryParams{
					sort:  "name",
					order: SortOrder("invalid"),
				},
				PaginationQueryParams: PaginationQueryParams{
					start: 0,
					limit: 10,
				},
			},
			description: "Should accept invalid sort order as SortOrder type",
		},
		{
			name: "empty string values",
			queryParams: map[string]string{
				"search": "",
				"sort":   "",
				"order":  "",
				"start":  "0",
				"limit":  "0",
			},
			expectedResult: QueryParams{
				SearchQueryParams: SearchQueryParams{
					search: "",
				},
				SortQueryParams: SortQueryParams{
					sort:  "",
					order: SortOrder(""),
				},
				PaginationQueryParams: PaginationQueryParams{
					start: 0,
					limit: 0,
				},
			},
			description: "Should handle empty string values correctly",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create HTTP request with query parameters
			req := createRequestWithParams(tt.queryParams)

			// Execute the function
			result := ExtractListModifiersQueryParams(req)

			// Assertions
			require.Equal(t, tt.expectedResult.search, result.search,
				"Search parameter should match expected value")
			require.Equal(t, tt.expectedResult.sort, result.sort,
				"Sort parameter should match expected value")
			require.Equal(t, tt.expectedResult.order, result.order,
				"Order parameter should match expected value")
			require.Equal(t, tt.expectedResult.start, result.start,
				"Start parameter should match expected value")
			require.Equal(t, tt.expectedResult.limit, result.limit,
				"Limit parameter should match expected value")

			// Verify the complete struct
			require.Equal(t, tt.expectedResult, result, tt.description)
		})
	}
}

func TestSortOrderConstants(t *testing.T) {
	t.Parallel()
	require.Equal(t, SortAsc, SortOrder("asc"), "SortAsc constant should equal 'asc'")
	require.Equal(t, SortDesc, SortOrder("desc"), "SortDesc constant should equal 'desc'")
}

func TestQueryParamsStructEmbedding(t *testing.T) {
	t.Parallel()
	qp := QueryParams{
		SearchQueryParams:     SearchQueryParams{search: "test"},
		SortQueryParams:       SortQueryParams{sort: "name", order: SortAsc},
		PaginationQueryParams: PaginationQueryParams{start: 10, limit: 20},
	}

	// Test that embedded fields are accessible
	require.Equal(t, "test", qp.search, "Embedded search field should be accessible")
	require.Equal(t, "name", qp.sort, "Embedded sort field should be accessible")
	require.Equal(t, SortAsc, qp.order, "Embedded order field should be accessible")
	require.Equal(t, 10, qp.start, "Embedded start field should be accessible")
	require.Equal(t, 20, qp.limit, "Embedded limit field should be accessible")
}

func TestExtractListModifiersQueryParamsEdgeCases(t *testing.T) {
	t.Parallel()
	t.Run("special characters in search", func(t *testing.T) {
		req := createRequestWithParams(map[string]string{
			"search": "test & special chars %20",
		})

		result := ExtractListModifiersQueryParams(req)
		require.Equal(t, "test & special chars %20", result.search,
			"Should handle special characters in search parameter")
	})

	t.Run("unicode characters", func(t *testing.T) {
		req := createRequestWithParams(map[string]string{
			"search": "test 测试 🔍",
			"sort":   "título",
		})

		result := ExtractListModifiersQueryParams(req)
		require.Equal(t, "test 测试 🔍", result.search, "Should handle unicode in search")
		require.Equal(t, "título", result.sort, "Should handle unicode in sort field")
	})

	t.Run("very long values", func(t *testing.T) {
		longSearch := "a very long search query that contains many words and goes on for quite some time to test handling of long strings"
		req := createRequestWithParams(map[string]string{
			"search": longSearch,
		})

		result := ExtractListModifiersQueryParams(req)
		require.Equal(t, longSearch, result.search, "Should handle long search strings")
	})
}

// Helper function to create HTTP request with query parameters
func createRequestWithParams(params map[string]string) *http.Request {
	// Create URL with query parameters
	u := &url.URL{
		Scheme: "https",
		Host:   "example.com",
		Path:   "/test",
	}

	// Add query parameters
	q := u.Query()
	for key, value := range params {
		q.Set(key, value)
	}
	u.RawQuery = q.Encode()

	// Create request
	req, _ := http.NewRequest("GET", u.String(), nil)
	return req
}

// Benchmark tests
func BenchmarkExtractListModifiersQueryParams(b *testing.B) {
	req := createRequestWithParams(map[string]string{
		"search": "benchmark test",
		"sort":   "name",
		"order":  "asc",
		"start":  "10",
		"limit":  "25",
	})

	for b.Loop() {
		ExtractListModifiersQueryParams(req)
	}
}

func BenchmarkExtractListModifiersQueryParamsEmpty(b *testing.B) {
	req := createRequestWithParams(map[string]string{})

	for b.Loop() {
		ExtractListModifiersQueryParams(req)
	}
}
