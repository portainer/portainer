package edgejobs

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/internal/maps"
	"github.com/portainer/portainer/pkg/featureflags"

	"github.com/asaskevich/govalidator"
)

type edgeJobBasePayload struct {
	Name           string
	CronExpression string
	Recurring      bool
	Endpoints      []portainer.EndpointID
	EdgeGroups     []portainer.EdgeGroupID
}

func (handler *Handler) edgeJobCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	method, err := request.RetrieveRouteVariableValue(r, "method")
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: method. Valid values are: file or string", err)
	}

	switch method {
	case "string":
		return handler.createEdgeJobFromFileContent(w, r)
	case "file":
		return handler.createEdgeJobFromFile(w, r)
	default:
		return httperror.BadRequest("Invalid query parameter: method. Valid values are: file or string", errors.New(strings.ToLower(request.ErrInvalidQueryParameter)))
	}
}

type edgeJobCreateFromFileContentPayload struct {
	edgeJobBasePayload
	FileContent string
}

func (payload *edgeJobCreateFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return errors.New("invalid Edge job name")
	}

	if !govalidator.Matches(payload.Name, `^[a-zA-Z0-9][a-zA-Z0-9_.-]*$`) {
		return errors.New("invalid Edge job name format. Allowed characters are: [a-zA-Z0-9_.-]")
	}

	if govalidator.IsNull(payload.CronExpression) {
		return errors.New("invalid cron expression")
	}

	if len(payload.Endpoints) == 0 && len(payload.EdgeGroups) == 0 {
		return errors.New("no environments or groups have been provided")
	}

	if govalidator.IsNull(payload.FileContent) {
		return errors.New("invalid script file content")
	}

	return nil
}

// @id EdgeJobCreateString
// @summary Create an EdgeJob from a text
// @description **Access policy**: administrator
// @tags edge_jobs
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param body body edgeJobCreateFromFileContentPayload true "EdgeGroup data when method is string"
// @success 200 {object} portainer.EdgeGroup
// @failure 503 "Edge compute features are disabled"
// @failure 500
// @router /edge_jobs/create/string [post]
func (handler *Handler) createEdgeJobFromFileContent(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload edgeJobCreateFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var edgeJob *portainer.EdgeJob
	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		edgeJob, err = handler.createEdgeJob(handler.DataStore, &payload.edgeJobBasePayload, []byte(payload.FileContent))
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			edgeJob, err = handler.createEdgeJob(tx, &payload.edgeJobBasePayload, []byte(payload.FileContent))

			return err
		})
	}

	return txResponse(w, edgeJob, err)
}

func (handler *Handler) createEdgeJob(tx dataservices.DataStoreTx, payload *edgeJobBasePayload, fileContent []byte) (*portainer.EdgeJob, error) {
	var err error

	edgeJob := handler.createEdgeJobObjectFromPayload(tx, payload)

	var endpoints []portainer.EndpointID
	if len(edgeJob.EdgeGroups) > 0 {
		endpoints, err = edge.GetEndpointsFromEdgeGroups(payload.EdgeGroups, tx)
		if err != nil {
			return nil, httperror.InternalServerError("Unable to get Endpoints from EdgeGroups", err)
		}
	}

	err = handler.addAndPersistEdgeJob(tx, edgeJob, fileContent, endpoints)
	if err != nil {
		return nil, httperror.InternalServerError("Unable to schedule Edge job", err)
	}

	return edgeJob, nil
}

type edgeJobCreateFromFilePayload struct {
	edgeJobBasePayload
	File []byte
}

func (payload *edgeJobCreateFromFilePayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return errors.New("invalid Edge job name")
	}

	if !govalidator.Matches(name, `^[a-zA-Z0-9][a-zA-Z0-9_.-]+$`) {
		return errors.New("invalid Edge job name format. Allowed characters are: [a-zA-Z0-9_.-]")
	}
	payload.Name = name

	cronExpression, err := request.RetrieveMultiPartFormValue(r, "CronExpression", false)
	if err != nil {
		return errors.New("invalid cron expression")
	}
	payload.CronExpression = cronExpression

	var endpoints []portainer.EndpointID
	err = request.RetrieveMultiPartFormJSONValue(r, "Endpoints", &endpoints, true)
	if err != nil {
		return errors.New("invalid environments")
	}
	payload.Endpoints = endpoints

	var edgeGroups []portainer.EdgeGroupID
	err = request.RetrieveMultiPartFormJSONValue(r, "EdgeGroups", &edgeGroups, true)
	if err != nil {
		return errors.New("invalid edge groups")
	}
	payload.EdgeGroups = edgeGroups

	if len(payload.Endpoints) == 0 && len(payload.EdgeGroups) == 0 {
		return errors.New("no environments or groups have been provided")
	}

	file, _, err := request.RetrieveMultiPartFormFile(r, "file")
	if err != nil {
		return errors.New("invalid script file. Ensure that the file is uploaded correctly")
	}
	payload.File = file

	return nil
}

// @id EdgeJobCreateFile
// @summary Create an EdgeJob from a file
// @description **Access policy**: administrator
// @tags edge_jobs
// @accept multipart/form-data
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param file formData file true "Content of the Stack file"
// @param Name formData string true "Name of the stack"
// @param CronExpression formData string true "A cron expression to schedule this job"
// @param EdgeGroups formData string true "JSON stringified array of Edge Groups ids"
// @param Endpoints formData string true "JSON stringified array of Environment ids"
// @param Recurring formData bool false "If recurring"
// @success 200 {object} portainer.EdgeGroup
// @failure 503 "Edge compute features are disabled"
// @failure 500
// @router /edge_jobs/create/file [post]
func (handler *Handler) createEdgeJobFromFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := &edgeJobCreateFromFilePayload{}
	err := payload.Validate(r)
	if err != nil {
		return httperror.BadRequest("Invalid request payload", err)
	}

	var edgeJob *portainer.EdgeJob
	if featureflags.IsEnabled(portainer.FeatureNoTx) {
		edgeJob, err = handler.createEdgeJob(handler.DataStore, &payload.edgeJobBasePayload, payload.File)
	} else {
		err = handler.DataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
			edgeJob, err = handler.createEdgeJob(tx, &payload.edgeJobBasePayload, payload.File)

			return err
		})
	}

	return txResponse(w, edgeJob, err)
}

func (handler *Handler) createEdgeJobObjectFromPayload(tx dataservices.DataStoreTx, payload *edgeJobBasePayload) *portainer.EdgeJob {
	return &portainer.EdgeJob{
		ID:                  portainer.EdgeJobID(tx.EdgeJob().GetNextIdentifier()),
		Name:                payload.Name,
		CronExpression:      payload.CronExpression,
		Recurring:           payload.Recurring,
		Created:             time.Now().Unix(),
		Endpoints:           convertEndpointsToMetaObject(payload.Endpoints),
		EdgeGroups:          payload.EdgeGroups,
		Version:             1,
		GroupLogsCollection: map[portainer.EndpointID]portainer.EdgeJobEndpointMeta{},
	}
}

func (handler *Handler) addAndPersistEdgeJob(tx dataservices.DataStoreTx, edgeJob *portainer.EdgeJob, file []byte, endpointsFromGroups []portainer.EndpointID) error {
	edgeCronExpression := strings.Split(edgeJob.CronExpression, " ")
	if len(edgeCronExpression) == 6 {
		edgeCronExpression = edgeCronExpression[1:]
	}
	edgeJob.CronExpression = strings.Join(edgeCronExpression, " ")

	for ID := range edgeJob.Endpoints {
		endpoint, err := tx.Endpoint().Endpoint(ID)
		if err != nil {
			return err
		}

		if !endpointutils.IsEdgeEndpoint(endpoint) {
			delete(edgeJob.Endpoints, ID)
		}
	}

	scriptPath, err := handler.FileService.StoreEdgeJobFileFromBytes(strconv.Itoa(int(edgeJob.ID)), file)
	if err != nil {
		return err
	}
	edgeJob.ScriptPath = scriptPath

	var endpointsMap map[portainer.EndpointID]portainer.EdgeJobEndpointMeta
	if len(endpointsFromGroups) > 0 {
		endpointsMap = convertEndpointsToMetaObject(endpointsFromGroups)

		for ID := range endpointsMap {
			endpoint, err := tx.Endpoint().Endpoint(ID)
			if err != nil {
				return err
			}

			if !endpointutils.IsEdgeEndpoint(endpoint) {
				delete(endpointsMap, ID)
			}
		}

		maps.Copy(endpointsMap, edgeJob.Endpoints)
	} else {
		endpointsMap = edgeJob.Endpoints
	}

	if len(endpointsMap) == 0 {
		return errors.New("environments or edge groups are mandatory for an Edge job")
	}

	for endpointID := range endpointsMap {
		endpoint, err := tx.Endpoint().Endpoint(endpointID)
		if err != nil {
			return err
		}

		handler.ReverseTunnelService.AddEdgeJob(endpoint, edgeJob)
	}

	return tx.EdgeJob().CreateWithID(edgeJob.ID, edgeJob)
}

// @id EdgeJobCreate
// @summary Create an EdgeJob
// @description **Access policy**: administrator
// @tags edge_jobs
// @security ApiKeyAuth
// @security jwt
// @produce json
// @param method query string true "Creation Method" Enums(file, string)
// @param body body object true "for body documentation see the relevant /edge_jobs/create/{method} endpoint"
// @success 200 {object} portainer.EdgeGroup
// @failure 503 "Edge compute features are disabled"
// @failure 500
// @deprecated
// @router /edge_jobs [post]
func deprecatedEdgeJobCreateUrlParser(w http.ResponseWriter, r *http.Request) (string, *httperror.HandlerError) {
	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return "", httperror.BadRequest("Invalid query parameter: method. Valid values are: file or string", err)
	}

	return fmt.Sprintf("/edge_jobs/create/%s", method), nil
}
