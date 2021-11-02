package apikey

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func Test_SatisfiesAPIKeyServiceInterface(t *testing.T) {
	is := assert.New(t)
	is.Implements((*APIKeyService)(nil), NewAPIKeyService(nil))
}
