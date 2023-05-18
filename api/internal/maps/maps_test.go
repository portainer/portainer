package maps

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGet(t *testing.T) {
	t.Run("xx", func(t *testing.T) {
		jsonStr := "{\"data\":{\"yesterday\":{\"sunrise\":\"06:19\"}}}"
		data := make(map[string]interface{})
		err := json.Unmarshal([]byte(jsonStr), &data)
		if err != nil {
			fmt.Printf("error: %s", err)
			return
		}
		result := Get(data, "data.yesterday", "sunrise")
		fmt.Printf("result: %s\n", result)
		expected := "06:19"
		assert.Equal(t, expected, result)
	})
	t.Run("xx", func(t *testing.T) {
		jsonStr := "{\"data\":{\"yesterday\": \"hahaha\"}}"
		data := make(map[string]interface{})
		err := json.Unmarshal([]byte(jsonStr), &data)
		if err != nil {
			fmt.Printf("error: %s", err)
			return
		}
		result := Get(data, "data.yesterday", "sunrise")
		fmt.Printf("result: %s\n", result)
		expected := ""
		assert.Equal(t, expected, result)
	})
}
