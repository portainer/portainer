package boltdb

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_MarshalObject(t *testing.T) {
	is := assert.New(t)

	tests := []struct {
		object   interface{}
		expected string
	}{
		{
			object:   nil,
			expected: `null`,
		},
		{
			object:   true,
			expected: `true`,
		},
		{
			object:   false,
			expected: `false`,
		},
		{
			object:   123,
			expected: `123`,
		},
		{
			object:   "456",
			expected: "456",
		},
		{
			object:   map[string]interface{}{"key": "value"},
			expected: `{"key":"value"}`,
		},
		{
			object:   []bool{true, false},
			expected: `[true,false]`,
		},
		{
			object:   []int{1, 2, 3},
			expected: `[1,2,3]`,
		},
		{
			object:   []string{"1", "2", "3"},
			expected: `["1","2","3"]`,
		},
		{
			object:   []map[string]interface{}{{"key1": "value1"}, {"key2": "value2"}},
			expected: `[{"key1":"value1"},{"key2":"value2"}]`,
		},
		{
			object:   []interface{}{1, "2", false, map[string]interface{}{"key1": "value1"}},
			expected: `[1,"2",false,{"key1":"value1"}]`,
		},
	}

	for _, test := range tests {
		t.Run(fmt.Sprintf("%s -> %s", test.object, test.expected), func(t *testing.T) {
			data, err := MarshalObject(test.object)
			is.NoError(err)
			is.Equal(test.expected, string(data))
		})
	}
}

func Test_UnMarshalObject(t *testing.T) {
	is := assert.New(t)

	tests := []struct {
		object   []byte
		expected string
	}{
		{
			object:   []byte(""),
			expected: "",
		},
		{
			object:   []byte("35"),
			expected: `35`,
		},
		{
			object:   []byte("456"),
			expected: "456",
		},
		{
			object:   []byte("9ca4a1dd-a439-4593-b386-a7dfdc2e9fc6"),
			expected: "9ca4a1dd-a439-4593-b386-a7dfdc2e9fc6",
		},
	}

	for _, test := range tests {
		t.Run(fmt.Sprintf("%s -> %s", test.object, test.expected), func(t *testing.T) {
			var object string
			err := UnmarshalObject(test.object, &object)
			is.NoError(err)
			is.Equal(test.expected, string(object))
		})
	}
}
