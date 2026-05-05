package errorlist

import (
	"errors"
	"strings"
)

// Combine a slice of errors into a single error
// to use this, generate errors by appending to errorList in a loop, then return combine(errorList)
func Combine(errorList []error) error {
	if len(errorList) == 0 {
		return nil
	}

	var sb strings.Builder
	sb.WriteString("Multiple errors occurred:")
	for _, err := range errorList {
		sb.WriteString("\n")
		sb.WriteString(err.Error())
	}

	return errors.New(sb.String())
}
