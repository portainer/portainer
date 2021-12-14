package backup

import (
	"fmt"
	"net/http"

	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	operations "github.com/portainer/portainer/api/backup"
)

type seedPayload map[string]interface{}

func (p *seedPayload) Validate(r *http.Request) error {
	if p == nil {
		return errors.New("Invalid seed data")
	}
	return nil
}

// @id Seed
// @summary Overrwrites the current key-val database with provided payload - ONLY USE FOR TESTING.
// @description  Overrwrites the current key-val database with provided payload - ONLY USE FOR TESTING; enable with `db-seed` feature flag.
// @description **Access policy**: admin
// @tags backup
// @security ApiKeyAuth
// @security jwt
// @accept json
// @param body body seedPayload true "The db seed payload - used to override current DB state"
// @success 200 "Success"
// @failure 400 "Invalid request"
// @failure 404 "Not found"
// @failure 500 "Server error"
// @router /seed [post]
func (h *Handler) seed(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	if !h.dataStore.Settings().IsFeatureFlagEnabled(portainer.FeatDBSeed) {
		return &httperror.HandlerError{
			StatusCode: http.StatusNotFound,
			Message:    "Not found",
			Err:        fmt.Errorf("feature flag '%s' not set", portainer.FeatDBSeed),
		}
	}

	h.adminMonitor.Stop()
	defer h.adminMonitor.Start()

	var payload seedPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusBadRequest, Message: "Invalid request payload", Err: err}
	}

	if err := operations.SeedStore(payload, h.filestorePath, h.gate, h.dataStore, h.shutdownTrigger); err != nil {
		return &httperror.HandlerError{StatusCode: http.StatusInternalServerError, Message: "Failed to seed the store", Err: err}
	}

	return nil
}
