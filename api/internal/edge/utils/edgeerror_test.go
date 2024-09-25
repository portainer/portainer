package utils

import (
	"errors"
	"testing"
)

func TestError(t *testing.T) {
	f := func(endpoint string, err error, expectErrMsg string) {
		ee := NewEdgeError(endpoint, err)
		if ee.Error() != expectErrMsg {
			t.Errorf("expected %s but got %s", expectErrMsg, ee.Error())
		}
	}

	f("1", nil, "Edge poll error. Environment ID: 1")
	f("new-zealand-agent-1", nil, "Edge poll error. Environment: new-zealand-agent-1")
	f("", nil, "Edge poll error")
	f("1", errors.New("some error"), "Edge poll error: some error. Environment ID: 1")
	f("new-zealand-agent-1", errors.New("some error"), "Edge poll error: some error. Environment: new-zealand-agent-1")
	f("", errors.New("some error"), "Edge poll error: some error")
}
