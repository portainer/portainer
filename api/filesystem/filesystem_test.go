package filesystem

import (
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
)

func createService(t *testing.T) *Service {
	dataStorePath := path.Join(os.TempDir(), t.Name())

	service, err := NewService(dataStorePath, "")
	assert.NoError(t, err, "NewService should not fail")

	t.Cleanup(func() {
		os.RemoveAll(dataStorePath)
	})

	return service
}
