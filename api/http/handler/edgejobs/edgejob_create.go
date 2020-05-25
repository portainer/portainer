package edgejobs

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer/api"
)

type edgeJobCreateFromFilePayload struct {
	Name           string
	CronExpression string
	Recurring      bool
	Endpoints      []portainer.EndpointID
	File           []byte
}

type edgeJobCreateFromFileContentPayload struct {
	Name           string
	CronExpression string
	Recurring      bool
	Endpoints      []portainer.EndpointID
	FileContent    string
}

func (payload *edgeJobCreateFromFilePayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return errors.New("Invalid Edge job name")
	}

	if !govalidator.Matches(name, `^[a-zA-Z0-9][a-zA-Z0-9_.-]+$`) {
		return errors.New("Invalid Edge job name format. Allowed characters are: [a-zA-Z0-9_.-]")
	}
	payload.Name = name

	cronExpression, err := request.RetrieveMultiPartFormValue(r, "CronExpression", false)
	if err != nil {
		return errors.New("Invalid cron expression")
	}
	payload.CronExpression = cronExpression

	var endpoints []portainer.EndpointID
	err = request.RetrieveMultiPartFormJSONValue(r, "Endpoints", &endpoints, false)
	if err != nil {
		return errors.New("Invalid endpoints")
	}
	payload.Endpoints = endpoints

	file, _, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return portainer.Error("Invalid script file. Ensure that the file is uploaded correctly")
	}
	payload.File = file

	return nil
}

func (payload *edgeJobCreateFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid Edge job name")
	}

	if !govalidator.Matches(payload.Name, `^[a-zA-Z0-9][a-zA-Z0-9_.-]*$`) {
		return errors.New("Invalid Edge job name format. Allowed characters are: [a-zA-Z0-9_.-]")
	}

	if govalidator.IsNull(payload.CronExpression) {
		return portainer.Error("Invalid cron expression")
	}

	if payload.Endpoints == nil || len(payload.Endpoints) == 0 {
		return portainer.Error("Invalid endpoints payload")
	}

	if govalidator.IsNull(payload.FileContent) {
		return portainer.Error("Invalid script file content")
	}

	return nil
}

// POST /api/edge_jobs?method=file|string
func (handler *Handler) edgeJobCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.DataStore.Settings().Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Unable to retrieve settings", err}
	}

	if !settings.EnableEdgeComputeFeatures {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Edge compute features are disabled", portainer.ErrHostManagementFeaturesDisabled}
	}

	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method. Valid values are: file or string", err}
	}

	switch method {
	case "string":
		return handler.createEdgeJobFromFileContent(w, r)
	case "file":
		return handler.createEdgeJobFromFile(w, r)
	default:
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method. Valid values are: file or string", errors.New(request.ErrInvalidQueryParameter)}
	}
}

func (handler *Handler) createEdgeJobFromFileContent(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload edgeJobCreateFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	edgeJob := handler.createEdgeJobObjectFromFileContentPayload(&payload)

	err = handler.addAndPersistEdgeJob(edgeJob, []byte(payload.FileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to schedule Edge job", err}
	}

	return response.JSON(w, edgeJob)
}

func (handler *Handler) createEdgeJobFromFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := &edgeJobCreateFromFilePayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	edgeJob := handler.createEdgeJobObjectFromFilePayload(payload)

	err = handler.addAndPersistEdgeJob(edgeJob, payload.File)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to schedule Edge job", err}
	}

	return response.JSON(w, edgeJob)
}

func (handler *Handler) createEdgeJobObjectFromFilePayload(payload *edgeJobCreateFromFilePayload) *portainer.EdgeJob {
	edgeJobIdentifier := portainer.EdgeJobID(handler.DataStore.EdgeJob().GetNextIdentifier())

	edgeJob := &portainer.EdgeJob{
		ID:             edgeJobIdentifier,
		Name:           payload.Name,
		CronExpression: payload.CronExpression,
		Recurring:      payload.Recurring,
		Created:        time.Now().Unix(),
		Endpoints:      payload.Endpoints,
		Version:        1,
	}

	return edgeJob
}

func (handler *Handler) createEdgeJobObjectFromFileContentPayload(payload *edgeJobCreateFromFileContentPayload) *portainer.EdgeJob {
	edgeJobIdentifier := portainer.EdgeJobID(handler.DataStore.EdgeJob().GetNextIdentifier())

	edgeJob := &portainer.EdgeJob{
		ID:             edgeJobIdentifier,
		Name:           payload.Name,
		CronExpression: payload.CronExpression,
		Recurring:      payload.Recurring,
		Created:        time.Now().Unix(),
		Endpoints:      payload.Endpoints,
		Version:        1,
	}

	return edgeJob
}

func (handler *Handler) addAndPersistEdgeJob(edgeJob *portainer.EdgeJob, file []byte) error {
	endpointIDs := make([]portainer.EndpointID, 0)

	edgeCronExpression := strings.Split(edgeJob.CronExpression, " ")
	if len(edgeCronExpression) == 6 {
		edgeCronExpression = edgeCronExpression[1:]
	}
	edgeJob.CronExpression = strings.Join(edgeCronExpression, " ")

	for _, ID := range edgeJob.Endpoints {
		endpoint, err := handler.DataStore.Endpoint().Endpoint(ID)
		if err != nil {
			return err
		}

		if endpoint.Type == portainer.EdgeAgentEnvironment {
			endpointIDs = append(endpointIDs, endpoint.ID)
		}
	}

	if len(endpointIDs) == 0 {
		return errors.New("Endpoints are mandatory for an Edge job")
	}

	edgeJob.Endpoints = endpointIDs

	for _, endpointID := range endpointIDs {
		handler.ReverseTunnelService.AddEdgeJob(endpointID, edgeJob)
	}

	scriptPath, err := handler.FileService.StoreEdgeJobFileFromBytes(strconv.Itoa(int(edgeJob.ID)), file)
	if err != nil {
		return err
	}

	edgeJob.ScriptPath = scriptPath

	return handler.DataStore.EdgeJob().CreateEdgeJob(edgeJob)
}
