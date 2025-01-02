package request_test

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/portainer/portainer/pkg/libhttp/request"

	"github.com/segmentio/encoding/json"
	"github.com/stretchr/testify/assert"
)

type requestPayload struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

func (p *requestPayload) Validate(r *http.Request) error {
	return nil
}

func Test_GetPayload(t *testing.T) {
	payload := requestPayload{
		FirstName: "John",
		LastName:  "Doe",
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		t.Fatal(err)
	}

	r := httptest.NewRequest(http.MethodPost, "/", bytes.NewReader(payloadJSON))

	newPayload, err := request.GetPayload[requestPayload](r)
	if err != nil {
		t.Fatal(err)
	}

	assert.Equal(t, payload, *newPayload)
}
