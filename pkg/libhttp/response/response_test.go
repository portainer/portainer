package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestJSONWithStatus(t *testing.T) {
	type TestData struct {
		Message string `json:"message"`
	}

	tests := []struct {
		name   string
		data   any
		status int
	}{
		{
			name:   "Success",
			data:   TestData{Message: "Hello, World!"},
			status: http.StatusOK,
		},
		{
			name:   "Internal Server Error",
			data:   TestData{Message: "Internal Server Error"},
			status: http.StatusInternalServerError,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()

			httpErr := JSONWithStatus(recorder, test.data, test.status)

			assert.Nil(t, httpErr)
			assert.Equal(t, test.status, recorder.Code)
			assert.Equal(t, "application/json", recorder.Header().Get("Content-Type"))

			var response TestData
			err := json.Unmarshal(recorder.Body.Bytes(), &response)

			assert.NoError(t, err)
			assert.Equal(t, test.data, response)
		})
	}
}

func TestJSON(t *testing.T) {
	type TestData struct {
		Message string `json:"message"`
	}

	tests := []struct {
		name   string
		data   any
		status int
	}{
		{
			name:   "Success",
			data:   TestData{Message: "Hello, World!"},
			status: http.StatusOK,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()

			httpErr := JSONWithStatus(recorder, test.data, test.status)

			assert.Nil(t, httpErr)
			assert.Equal(t, test.status, recorder.Code)
			assert.Equal(t, "application/json", recorder.Header().Get("Content-Type"))

			var response TestData
			err := json.Unmarshal(recorder.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, test.data, response)
		})
	}
}

func TestYAML(t *testing.T) {
	tests := []struct {
		name     string
		data     any
		expected string
		invalid  bool
	}{
		{
			name:     "Success",
			data:     "key: value",
			expected: "key: value",
		},
		{
			name:     "Invalid Data",
			data:     123,
			expected: "",
			invalid:  true,
		},
		{
			name: "doesn't support an Object",
			data: map[string]any{
				"key": "value",
			},
			expected: "",
			invalid:  true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()

			httpErr := YAML(recorder, test.data)

			if test.invalid {
				assert.NotNil(t, httpErr)
				assert.Equal(t, http.StatusInternalServerError, httpErr.StatusCode)
				return
			}

			assert.Nil(t, httpErr)
			assert.Equal(t, http.StatusOK, recorder.Code)
			assert.Equal(t, "text/yaml", recorder.Header().Get("Content-Type"))
			assert.Equal(t, test.expected, recorder.Body.String())
		})
	}
}

func TestEmpty(t *testing.T) {
	recorder := httptest.NewRecorder()

	httpErr := Empty(recorder)

	assert.Nil(t, httpErr)
	assert.Equal(t, http.StatusNoContent, recorder.Code)
}
