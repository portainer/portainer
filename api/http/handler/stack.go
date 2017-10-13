package handler

import (
	"encoding/json"
	"path"
	"strconv"
	"strings"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	httperror "github.com/portainer/portainer/http/error"
	"github.com/portainer/portainer/http/proxy"
	"github.com/portainer/portainer/http/security"

	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
)

// StackHandler represents an HTTP API handler for managing Stack.
type StackHandler struct {
	*mux.Router
	Logger                 *log.Logger
	FileService            portainer.FileService
	GitService             portainer.GitService
	StackService           portainer.StackService
	EndpointService        portainer.EndpointService
	ResourceControlService portainer.ResourceControlService
	StackManager           portainer.StackManager
}

// NewStackHandler returns a new instance of StackHandler.
func NewStackHandler(bouncer *security.RequestBouncer) *StackHandler {
	h := &StackHandler{
		Router: mux.NewRouter(),
		Logger: log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/{endpointId}/stacks",
		bouncer.AuthenticatedAccess(http.HandlerFunc(h.handlePostStacks))).Methods(http.MethodPost)
	h.Handle("/{endpointId}/stacks",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handleGetStacks))).Methods(http.MethodGet)
	h.Handle("/{endpointId}/stacks/{id}",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handleGetStack))).Methods(http.MethodGet)
	h.Handle("/{endpointId}/stacks/{id}",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handleDeleteStack))).Methods(http.MethodDelete)
	h.Handle("/{endpointId}/stacks/{id}",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handlePutStack))).Methods(http.MethodPut)
	h.Handle("/{endpointId}/stacks/{id}/stackfile",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handleGetStackFile))).Methods(http.MethodGet)
	return h
}

type (
	postStacksRequest struct {
		Name             string `valid:"required"`
		StackFileContent string `valid:""`
		GitRepository    string `valid:""`
		PathInRepository string `valid:""`
	}
	postStacksResponse struct {
		ID int `json:"Id"`
	}
	getStackFileResponse struct {
		StackFileContent string `json:"StackFileContent"`
	}
	putStackRequest struct {
		StackFileContent string `valid:"required"`
	}
)

// handlePostStacks handles POST requests on /:endpointId/stacks?method=<method>
func (handler *StackHandler) handlePostStacks(w http.ResponseWriter, r *http.Request) {
	method := r.FormValue("method")
	if method == "" {
		httperror.WriteErrorResponse(w, ErrInvalidQueryFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	if method == "string" {
		handler.handlePostStacksStringMethod(w, r)
	} else if method == "repository" {
		handler.handlePostStacksRepositoryMethod(w, r)
	} else if method == "file" {
		handler.handlePostStacksFileMethod(w, r)
	} else {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}
}

func (handler *StackHandler) handlePostStacksStringMethod(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["endpointId"])
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}
	endpointID := portainer.EndpointID(id)

	endpoint, err := handler.EndpointService.Endpoint(endpointID)
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	var req postStacksRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	if req.StackFileContent == "" {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	stacks, err := handler.StackService.Stacks()
	if err != nil && err != portainer.ErrStackNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, req.Name) && stack.EndpointID == endpointID {
			httperror.WriteErrorResponse(w, portainer.ErrStackAlreadyExists, http.StatusConflict, handler.Logger)
			return
		}
	}

	stack := &portainer.Stack{
		Name:       req.Name,
		EndpointID: endpointID,
		EntryPoint: "docker-compose.yml",
	}

	projectPath, err := handler.FileService.StoreStackFileFromString(stack.Name, req.StackFileContent)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	stack.ProjectPath = projectPath

	err = handler.StackManager.Deploy(stack, endpoint)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.StackService.CreateStack(stack)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postStacksResponse{ID: int(stack.ID)}, handler.Logger)
}

func (handler *StackHandler) handlePostStacksRepositoryMethod(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["endpointId"])
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}
	endpointID := portainer.EndpointID(id)

	endpoint, err := handler.EndpointService.Endpoint(endpointID)
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	var req postStacksRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	if req.GitRepository == "" {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	if req.PathInRepository == "" {
		req.PathInRepository = "docker-compose.yml"
	}

	stacks, err := handler.StackService.Stacks()
	if err != nil && err != portainer.ErrStackNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, req.Name) && stack.EndpointID == endpointID {
			httperror.WriteErrorResponse(w, portainer.ErrStackAlreadyExists, http.StatusConflict, handler.Logger)
			return
		}
	}

	stack := &portainer.Stack{
		Name:       req.Name,
		EndpointID: endpointID,
		EntryPoint: req.PathInRepository,
	}

	projectPath := handler.FileService.GetStackProjectPath(stack.Name)
	stack.ProjectPath = projectPath

	// Ensure projectPath is empty
	err = handler.FileService.RemoveDirectory(projectPath)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.GitService.CloneRepository(req.GitRepository, projectPath)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.StackManager.Deploy(stack, endpoint)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.StackService.CreateStack(stack)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postStacksResponse{ID: int(stack.ID)}, handler.Logger)
}

func (handler *StackHandler) handlePostStacksFileMethod(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["endpointId"])
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}
	endpointID := portainer.EndpointID(id)

	endpoint, err := handler.EndpointService.Endpoint(endpointID)
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	stackName := r.FormValue("Name")
	if stackName == "" {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	defer file.Close()

	stacks, err := handler.StackService.Stacks()
	if err != nil && err != portainer.ErrStackNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, stackName) && stack.EndpointID == endpointID {
			httperror.WriteErrorResponse(w, portainer.ErrStackAlreadyExists, http.StatusConflict, handler.Logger)
			return
		}
	}

	stack := &portainer.Stack{
		Name:       stackName,
		EndpointID: endpointID,
		EntryPoint: "docker-compose.yml",
	}

	projectPath, err := handler.FileService.StoreStackFileFromReader(stack.Name, file)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	stack.ProjectPath = projectPath

	err = handler.StackManager.Deploy(stack, endpoint)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.StackService.CreateStack(stack)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postStacksResponse{ID: int(stack.ID)}, handler.Logger)
}

// handleGetStacks handles GET requests on /:endpointId/stacks
func (handler *StackHandler) handleGetStacks(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	endpointID, err := strconv.Atoi(vars["endpointId"])
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	stacks, err := handler.StackService.StacksByEndpointID(portainer.EndpointID(endpointID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	resourceControls, err := handler.ResourceControlService.ResourceControls()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	var upStacks []proxy.ExtendedStack
	if securityContext.IsAdmin {
		upStacks = proxy.DecorateStacks(stacks, resourceControls, securityContext.UserID, securityContext.UserMemberships)
	} else {
		upStacks = proxy.FilterStacks(stacks, resourceControls, securityContext.UserID, securityContext.UserMemberships)
	}

	encodeJSON(w, upStacks, handler.Logger)
}

// handleGetStack handles GET requests on /:endpointId/stacks/:id
func (handler *StackHandler) handleGetStack(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	endpointID, err := strconv.Atoi(vars["endpointId"])
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	id := vars["id"]
	stackID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	stack, err := handler.StackService.Stack(portainer.StackID(stackID))
	if err == portainer.ErrStackNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	resourceControl, err := handler.ResourceControlService.ResourceControlByResourceID(stack.Name)
	if err != nil && err != portainer.ErrResourceControlNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	upStack := proxy.ExtendedStack{*stack, portainer.ResourceControl{}}
	if resourceControl != nil {
		if securityContext.IsAdmin || proxy.CanAccessStack(stack, resourceControl, securityContext.UserID, securityContext.UserMemberships) {
			upStack.ResourceControl = *resourceControl
		} else {
			httperror.WriteErrorResponse(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, handler.Logger)
		}
	}

	encodeJSON(w, upStack, handler.Logger)
}

// handlePutStack handles PUT requests on /:endpointId/stacks/:id
func (handler *StackHandler) handlePutStack(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	endpointID, err := strconv.Atoi(vars["endpointId"])
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	id := vars["id"]
	stackID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	stack, err := handler.StackService.Stack(portainer.StackID(stackID))
	if err == portainer.ErrStackNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	var req putStackRequest
	if err = json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidJSON, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = govalidator.ValidateStruct(req)
	if err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = handler.FileService.StoreStackFileFromString(stack.Name, req.StackFileContent)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.StackManager.Deploy(stack, endpoint)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handleGetStackFile handles GET requests on /:endpointId/stacks/:id/stackfile
func (handler *StackHandler) handleGetStackFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	endpointID, err := strconv.Atoi(vars["endpointId"])
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	id := vars["id"]
	stackID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	_, err = handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	stack, err := handler.StackService.Stack(portainer.StackID(stackID))
	if err == portainer.ErrStackNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	stackFileContent, err := handler.FileService.GetFileContent(path.Join(stack.ProjectPath, stack.EntryPoint))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	encodeJSON(w, &getStackFileResponse{StackFileContent: stackFileContent}, handler.Logger)
}

// handleDeleteStack handles DELETE requests on /:endpointId/stacks/:id
func (handler *StackHandler) handleDeleteStack(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)

	endpointID, err := strconv.Atoi(vars["endpointId"])
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	id := vars["id"]
	stackID, err := strconv.Atoi(id)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	stack, err := handler.StackService.Stack(portainer.StackID(stackID))
	if err == portainer.ErrStackNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.StackManager.Remove(stack, endpoint)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.StackService.DeleteStack(portainer.StackID(stackID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.FileService.DeleteStackFile(stack.ProjectPath)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}
