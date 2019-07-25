package schedules

import (
	"encoding/base64"
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
	"github.com/portainer/portainer/api/cron"
)

type scheduleCreateFromFilePayload struct {
	Name           string
	Image          string
	CronExpression string
	Recurring      bool
	Endpoints      []portainer.EndpointID
	File           []byte
	RetryCount     int
	RetryInterval  int
}

type scheduleCreateFromFileContentPayload struct {
	Name           string
	CronExpression string
	Recurring      bool
	Image          string
	Endpoints      []portainer.EndpointID
	FileContent    string
	RetryCount     int
	RetryInterval  int
}

func (payload *scheduleCreateFromFilePayload) Validate(r *http.Request) error {
	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return errors.New("Invalid schedule name")
	}

	if !govalidator.Matches(name, `^[a-zA-Z0-9][a-zA-Z0-9_.-]+$`) {
		return errors.New("Invalid schedule name format. Allowed characters are: [a-zA-Z0-9_.-]")
	}
	payload.Name = name

	image, err := request.RetrieveMultiPartFormValue(r, "Image", false)
	if err != nil {
		return errors.New("Invalid schedule image")
	}
	payload.Image = image

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

	retryCount, _ := request.RetrieveNumericMultiPartFormValue(r, "RetryCount", true)
	payload.RetryCount = retryCount

	retryInterval, _ := request.RetrieveNumericMultiPartFormValue(r, "RetryInterval", true)
	payload.RetryInterval = retryInterval

	return nil
}

func (payload *scheduleCreateFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid schedule name")
	}

	if !govalidator.Matches(payload.Name, `^[a-zA-Z0-9][a-zA-Z0-9_.-]+$`) {
		return errors.New("Invalid schedule name format. Allowed characters are: [a-zA-Z0-9_.-]")
	}

	if govalidator.IsNull(payload.Image) {
		return portainer.Error("Invalid schedule image")
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

	if payload.RetryCount != 0 && payload.RetryInterval == 0 {
		return portainer.Error("RetryInterval must be set")
	}

	return nil
}

// POST /api/schedules?method=file|string
func (handler *Handler) scheduleCreate(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	settings, err := handler.SettingsService.Settings()
	if err != nil {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Unable to retrieve settings", err}
	}
	if !settings.EnableHostManagementFeatures {
		return &httperror.HandlerError{http.StatusServiceUnavailable, "Host management features are disabled", portainer.ErrHostManagementFeaturesDisabled}
	}

	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method. Valid values are: file or string", err}
	}

	switch method {
	case "string":
		return handler.createScheduleFromFileContent(w, r)
	case "file":
		return handler.createScheduleFromFile(w, r)
	default:
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method. Valid values are: file or string", errors.New(request.ErrInvalidQueryParameter)}
	}
}

func (handler *Handler) createScheduleFromFileContent(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload scheduleCreateFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	schedule := handler.createScheduleObjectFromFileContentPayload(&payload)

	err = handler.addAndPersistSchedule(schedule, []byte(payload.FileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to schedule script job", err}
	}

	return response.JSON(w, schedule)
}

func (handler *Handler) createScheduleFromFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := &scheduleCreateFromFilePayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	schedule := handler.createScheduleObjectFromFilePayload(payload)

	err = handler.addAndPersistSchedule(schedule, payload.File)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to schedule script job", err}
	}

	return response.JSON(w, schedule)
}

func (handler *Handler) createScheduleObjectFromFilePayload(payload *scheduleCreateFromFilePayload) *portainer.Schedule {
	scheduleIdentifier := portainer.ScheduleID(handler.ScheduleService.GetNextIdentifier())

	job := &portainer.ScriptExecutionJob{
		Endpoints:     payload.Endpoints,
		Image:         payload.Image,
		RetryCount:    payload.RetryCount,
		RetryInterval: payload.RetryInterval,
	}

	schedule := &portainer.Schedule{
		ID:                 scheduleIdentifier,
		Name:               payload.Name,
		CronExpression:     payload.CronExpression,
		Recurring:          payload.Recurring,
		JobType:            portainer.ScriptExecutionJobType,
		ScriptExecutionJob: job,
		Created:            time.Now().Unix(),
	}

	return schedule
}

func (handler *Handler) createScheduleObjectFromFileContentPayload(payload *scheduleCreateFromFileContentPayload) *portainer.Schedule {
	scheduleIdentifier := portainer.ScheduleID(handler.ScheduleService.GetNextIdentifier())

	job := &portainer.ScriptExecutionJob{
		Endpoints:     payload.Endpoints,
		Image:         payload.Image,
		RetryCount:    payload.RetryCount,
		RetryInterval: payload.RetryInterval,
	}

	schedule := &portainer.Schedule{
		ID:                 scheduleIdentifier,
		Name:               payload.Name,
		CronExpression:     payload.CronExpression,
		Recurring:          payload.Recurring,
		JobType:            portainer.ScriptExecutionJobType,
		ScriptExecutionJob: job,
		Created:            time.Now().Unix(),
	}

	return schedule
}

func (handler *Handler) addAndPersistSchedule(schedule *portainer.Schedule, file []byte) error {
	nonEdgeEndpointIDs := make([]portainer.EndpointID, 0)
	edgeEndpointIDs := make([]portainer.EndpointID, 0)

	edgeCronExpression := strings.Split(schedule.CronExpression, " ")
	if len(edgeCronExpression) == 6 {
		edgeCronExpression = edgeCronExpression[1:]
	}

	for _, ID := range schedule.ScriptExecutionJob.Endpoints {

		endpoint, err := handler.EndpointService.Endpoint(ID)
		if err != nil {
			return err
		}

		if endpoint.Type != portainer.EdgeAgentEnvironment {
			nonEdgeEndpointIDs = append(nonEdgeEndpointIDs, endpoint.ID)
		} else {
			edgeEndpointIDs = append(edgeEndpointIDs, endpoint.ID)
		}
	}

	if len(edgeEndpointIDs) > 0 {
		edgeSchedule := &portainer.EdgeSchedule{
			ID:             schedule.ID,
			CronExpression: strings.Join(edgeCronExpression, " "),
			Script:         base64.RawStdEncoding.EncodeToString(file),
			Endpoints:      edgeEndpointIDs,
			Version:        1,
		}

		for _, endpointID := range edgeEndpointIDs {
			handler.ReverseTunnelService.AddSchedule(endpointID, edgeSchedule)
		}

		schedule.EdgeSchedule = edgeSchedule
	}

	schedule.ScriptExecutionJob.Endpoints = nonEdgeEndpointIDs

	scriptPath, err := handler.FileService.StoreScheduledJobFileFromBytes(strconv.Itoa(int(schedule.ID)), file)
	if err != nil {
		return err
	}

	schedule.ScriptExecutionJob.ScriptPath = scriptPath

	jobContext := cron.NewScriptExecutionJobContext(handler.JobService, handler.EndpointService, handler.FileService)
	jobRunner := cron.NewScriptExecutionJobRunner(schedule, jobContext)

	err = handler.JobScheduler.ScheduleJob(jobRunner)
	if err != nil {
		return err
	}

	return handler.ScheduleService.CreateSchedule(schedule)
}
