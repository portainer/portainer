package schedules

import (
	"net/http"

	"github.com/asaskevich/govalidator"
	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	"github.com/portainer/portainer"
)

type scheduleFromFilePayload struct {
	Name      string
	Endpoints []portainer.EndpointID
	Schedule  string
	File      []byte
}

type scheduleFromFileContentPayload struct {
	Name        string
	Endpoints   []portainer.EndpointID
	Schedule    string
	FileContent string
}

func (payload *scheduleFromFilePayload) Validate(r *http.Request) error {
	file, _, err := request.RetrieveMultiPartFormFile(r, "File")
	if err != nil {
		return portainer.Error("Invalid Script file. Ensure that the file is uploaded correctly")
	}
	payload.File = file

	name, err := request.RetrieveMultiPartFormValue(r, "Name", false)
	if err != nil {
		return err
	}
	payload.Name = name

	// TODO retrieve array of strings?
	var endpoints []portainer.EndpointID
	err = request.RetrieveMultiPartFormJSONValue(r, "Endpoints", &endpoints, false)
	if err != nil {
		return err
	}
	payload.Endpoints = endpoints

	schedule, err := request.RetrieveMultiPartFormValue(r, "Schedule", false)
	if err != nil {
		return err
	}
	payload.Schedule = schedule

	return nil
}

func (payload *scheduleFromFileContentPayload) Validate(r *http.Request) error {
	if govalidator.IsNull(payload.FileContent) {
		return portainer.Error("Invalid script file content")
	}

	if govalidator.IsNull(payload.Name) {
		return portainer.Error("Invalid schedule name")
	}

	if payload.Endpoints == nil || len(payload.Endpoints) == 0 {
		return portainer.Error("Invalid endpoints payload")
	}

	if govalidator.IsNull(payload.Schedule) {
		return portainer.Error("Invalid schedule type")
	}

	return nil
}

// POST /api/schedules?method=file/string
func (handler *Handler) createScheduleHandler(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	method, err := request.RetrieveQueryParameter(r, "method", false)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method", err}
	}

	switch method {
	case "string":
		return handler.createScheduleFromFileContent(w, r)
	case "file":
		return handler.createScheduleFromFile(w, r)
	default:
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid query parameter: method", err}
	}
}

func (handler *Handler) createScheduleFromFileContent(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload scheduleFromFileContentPayload
	err := request.DecodeAndValidateJSONPayload(r, &payload)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	schedule, err := handler.createSchedule(payload.Name, payload.Endpoints, payload.Schedule, []byte(payload.FileContent))
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed executing job", err}
	}
	return response.JSON(w, schedule)
}

func (handler *Handler) createScheduleFromFile(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	payload := &scheduleFromFilePayload{}
	err := payload.Validate(r)
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid request payload", err}
	}

	schedule, err := handler.createSchedule(payload.Name, payload.Endpoints, payload.Schedule, payload.File)
	if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Failed executing job", err}
	}

	return response.JSON(w, schedule)
}

func (handler *Handler) createSchedule(name string, endpoints []portainer.EndpointID, scheduleCron string, file []byte) (*portainer.Schedule, error) {
	schedule := &portainer.Schedule{
		Name:      name,
		Endpoints: endpoints,
		Schedule:  scheduleCron,
		ID:        portainer.ScheduleID(handler.scheduleService.GetNextIdentifier()),
	}

	err := handler.scheduleService.CreateSchedule(schedule)
	if err != nil {
		return nil, err
	}
	// TODO add to cron
	// TODO save file to fs

	return schedule, nil
}
