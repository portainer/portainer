package slicesx_test

import (
	"reflect"
	"testing"

	"github.com/portainer/portainer/api/slicesx"
)

func TestGroupBy(t *testing.T) {
	t.Parallel()
	input := []string{"apple", "banana", "cherry", "date", "elderberry"}
	f := func(a string) int {
		return len(a)
	}
	expected := map[int][]string{5: {"apple"}, 6: {"banana", "cherry"}, 4: {"date"}, 10: {"elderberry"}}
	result := slicesx.GroupBy(input, f)
	if !reflect.DeepEqual(expected, result) {
		t.Errorf("Expected %v, got %v", expected, result)
	}
}
