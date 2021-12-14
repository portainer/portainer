package backup

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_writeMapToFile(t *testing.T) {
	is := assert.New(t)

	data := map[string]interface{}{
		"key1": "value1",
		"key2": "value2",
	}

	f, err := writeMapToFile(data)
	defer os.Remove(f.Name())

	is.NoError(err)

	is.NotNil(f)
}
