package stacks

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/stretchr/testify/assert"
)

func Test_ValidateStackAutoUpdate_Valid(t *testing.T) {
	mock := &portainer.StackAutoUpdate{
		Webhook:  "8dce8c2f-9ca1-482b-ad20-271e86536ada",
		Interval: "5h30m40s10ms",
	}
	err := validateStackAutoUpdate(mock)
	assert.NoError(t, err)
	mock = nil
	err = validateStackAutoUpdate(mock)
	assert.NoError(t, err)
}

func Test_ValidateStackAutoUpdate_InValid(t *testing.T) {
	mock := &portainer.StackAutoUpdate{}
	err := validateStackAutoUpdate(mock)
	assert.Error(t, err)
	mock.Webhook = "fake-web-hook"
	err = validateStackAutoUpdate(mock)
	assert.Error(t, err)
	mock.Webhook = ""
	mock.Interval = "1dd2hh3mm"
	err = validateStackAutoUpdate(mock)
	assert.Error(t, err)
}
