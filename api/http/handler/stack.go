package handler

import (
	"encoding/json"
	"path"
	"strconv"
	"strings"
	"sync"

	"github.com/asaskevich/govalidator"
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/filesystem"
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
	stackCreationMutex *sync.Mutex
	stackDeletionMutex *sync.Mutex
	*mux.Router
	Logger                 *log.Logger
	FileService            portainer.FileService
	GitService             portainer.GitService
	StackService           portainer.StackService
	EndpointService        portainer.EndpointService
	ResourceControlService portainer.ResourceControlService
	RegistryService        portainer.RegistryService
	DockerHubService       portainer.DockerHubService
	StackManager           portainer.StackManager
}

type stackDeploymentConfig struct {
	endpoint   *portainer.Endpoint
	stack      *portainer.Stack
	prune      bool
	dockerhub  *portainer.DockerHub
	registries []portainer.Registry
}

// NewStackHandler returns a new instance of StackHandler.
func NewStackHandler(bouncer *security.RequestBouncer) *StackHandler {
	h := &StackHandler{
		Router:             mux.NewRouter(),
		stackCreationMutex: &sync.Mutex{},
		stackDeletionMutex: &sync.Mutex{},
		Logger:             log.New(os.Stderr, "", log.LstdFlags),
	}
	h.Handle("/{endpointId}/stacks",
		bouncer.RestrictedAccess(http.HandlerFunc(h.handlePostStacks))).Methods(http.MethodPost)
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
		Name             string           `valid:"required"`
		SwarmID          string           `valid:"required"`
		StackFileContent string           `valid:""`
		GitRepository    string           `valid:""`
		PathInRepository string           `valid:""`
		Env              []portainer.Pair `valid:""`
	}
	postStacksResponse struct {
		ID string `json:"Id"`
	}
	getStackFileResponse struct {
		StackFileContent string `json:"StackFileContent"`
	}
	putStackRequest struct {
		StackFileContent string           `valid:"required"`
		Env              []portainer.Pair `valid:""`
		Prune            bool             `valid:"-"`
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

	stackName := req.Name
	if stackName == "" {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	stackFileContent := req.StackFileContent
	if stackFileContent == "" {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	swarmID := req.SwarmID
	if swarmID == "" {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	stacks, err := handler.StackService.Stacks()
	if err != nil && err != portainer.ErrStackNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, stackName) {
			httperror.WriteErrorResponse(w, portainer.ErrStackAlreadyExists, http.StatusConflict, handler.Logger)
			return
		}
	}

	stack := &portainer.Stack{
		ID:         portainer.StackID(stackName + "_" + swarmID),
		Name:       stackName,
		SwarmID:    swarmID,
		EntryPoint: filesystem.ComposeFileDefaultName,
		Env:        req.Env,
	}

	projectPath, err := handler.FileService.StoreStackFileFromString(string(stack.ID), stack.EntryPoint, stackFileContent)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	stack.ProjectPath = projectPath

	err = handler.StackService.CreateStack(stack)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	dockerhub, err := handler.DockerHubService.DockerHub()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	registries, err := handler.RegistryService.Registries()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	filteredRegistries, err := security.FilterRegistries(registries, securityContext)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	config := stackDeploymentConfig{
		stack:      stack,
		endpoint:   endpoint,
		dockerhub:  dockerhub,
		registries: filteredRegistries,
		prune:      false,
	}
	err = handler.deployStack(&config)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postStacksResponse{ID: string(stack.ID)}, handler.Logger)
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

	stackName := req.Name
	if stackName == "" {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	swarmID := req.SwarmID
	if swarmID == "" {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	if req.GitRepository == "" {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	if req.PathInRepository == "" {
		req.PathInRepository = filesystem.ComposeFileDefaultName
	}

	stacks, err := handler.StackService.Stacks()
	if err != nil && err != portainer.ErrStackNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, stackName) {
			httperror.WriteErrorResponse(w, portainer.ErrStackAlreadyExists, http.StatusConflict, handler.Logger)
			return
		}
	}

	stack := &portainer.Stack{
		ID:         portainer.StackID(stackName + "_" + swarmID),
		Name:       stackName,
		SwarmID:    swarmID,
		EntryPoint: req.PathInRepository,
		Env:        req.Env,
	}

	projectPath := handler.FileService.GetStackProjectPath(string(stack.ID))
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

	err = handler.StackService.CreateStack(stack)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	dockerhub, err := handler.DockerHubService.DockerHub()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	registries, err := handler.RegistryService.Registries()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	filteredRegistries, err := security.FilterRegistries(registries, securityContext)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	config := stackDeploymentConfig{
		stack:      stack,
		endpoint:   endpoint,
		dockerhub:  dockerhub,
		registries: filteredRegistries,
		prune:      false,
	}
	err = handler.deployStack(&config)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postStacksResponse{ID: string(stack.ID)}, handler.Logger)
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

	swarmID := r.FormValue("SwarmID")
	if swarmID == "" {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	envParam := r.FormValue("Env")
	var env []portainer.Pair
	if err = json.Unmarshal([]byte(envParam), &env); err != nil {
		httperror.WriteErrorResponse(w, ErrInvalidRequestFormat, http.StatusBadRequest, handler.Logger)
		return
	}

	stackFile, _, err := r.FormFile("file")
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	defer stackFile.Close()

	stacks, err := handler.StackService.Stacks()
	if err != nil && err != portainer.ErrStackNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, stackName) {
			httperror.WriteErrorResponse(w, portainer.ErrStackAlreadyExists, http.StatusConflict, handler.Logger)
			return
		}
	}

	stack := &portainer.Stack{
		ID:         portainer.StackID(stackName + "_" + swarmID),
		Name:       stackName,
		SwarmID:    swarmID,
		EntryPoint: filesystem.ComposeFileDefaultName,
		Env:        env,
	}

	projectPath, err := handler.FileService.StoreStackFileFromReader(string(stack.ID), stack.EntryPoint, stackFile)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	stack.ProjectPath = projectPath

	err = handler.StackService.CreateStack(stack)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	dockerhub, err := handler.DockerHubService.DockerHub()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	registries, err := handler.RegistryService.Registries()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	filteredRegistries, err := security.FilterRegistries(registries, securityContext)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	config := stackDeploymentConfig{
		stack:      stack,
		endpoint:   endpoint,
		dockerhub:  dockerhub,
		registries: filteredRegistries,
		prune:      false,
	}
	err = handler.deployStack(&config)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	encodeJSON(w, &postStacksResponse{ID: string(stack.ID)}, handler.Logger)
}

// handleGetStacks handles GET requests on /:endpointId/stacks?swarmId=<swarmId>
func (handler *StackHandler) handleGetStacks(w http.ResponseWriter, r *http.Request) {
	swarmID := r.FormValue("swarmId")

	vars := mux.Vars(r)

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	id, err := strconv.Atoi(vars["endpointId"])
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusBadRequest, handler.Logger)
		return
	}
	endpointID := portainer.EndpointID(id)

	_, err = handler.EndpointService.Endpoint(endpointID)
	if err == portainer.ErrEndpointNotFound {
		httperror.WriteErrorResponse(w, err, http.StatusNotFound, handler.Logger)
		return
	} else if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	var stacks []portainer.Stack
	if swarmID == "" {
		stacks, err = handler.StackService.Stacks()
	} else {
		stacks, err = handler.StackService.StacksBySwarmID(swarmID)
	}
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	resourceControls, err := handler.ResourceControlService.ResourceControls()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	filteredStacks := proxy.FilterStacks(stacks, resourceControls, securityContext.IsAdmin,
		securityContext.UserID, securityContext.UserMemberships)

	encodeJSON(w, filteredStacks, handler.Logger)
}

// handleGetStack handles GET requests on /:endpointId/stacks/:id
func (handler *StackHandler) handleGetStack(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	stackID := vars["id"]

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

	extendedStack := proxy.ExtendedStack{*stack, portainer.ResourceControl{}}
	if resourceControl != nil {
		if securityContext.IsAdmin || proxy.CanAccessStack(stack, resourceControl, securityContext.UserID, securityContext.UserMemberships) {
			extendedStack.ResourceControl = *resourceControl
		} else {
			httperror.WriteErrorResponse(w, portainer.ErrResourceAccessDenied, http.StatusForbidden, handler.Logger)
			return
		}
	}

	encodeJSON(w, extendedStack, handler.Logger)
}

// handlePutStack handles PUT requests on /:endpointId/stacks/:id
func (handler *StackHandler) handlePutStack(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	stackID := vars["id"]

	endpointID, err := strconv.Atoi(vars["endpointId"])
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
	stack.Env = req.Env

	_, err = handler.FileService.StoreStackFileFromString(string(stack.ID), stack.EntryPoint, req.StackFileContent)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.StackService.UpdateStack(stack.ID, stack)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	securityContext, err := security.RetrieveRestrictedRequestContext(r)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	dockerhub, err := handler.DockerHubService.DockerHub()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	registries, err := handler.RegistryService.Registries()
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	filteredRegistries, err := security.FilterRegistries(registries, securityContext)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	config := stackDeploymentConfig{
		stack:      stack,
		endpoint:   endpoint,
		dockerhub:  dockerhub,
		registries: filteredRegistries,
		prune:      req.Prune,
	}
	err = handler.deployStack(&config)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

// handleGetStackFile handles GET requests on /:endpointId/stacks/:id/stackfile
func (handler *StackHandler) handleGetStackFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	stackID := vars["id"]

	endpointID, err := strconv.Atoi(vars["endpointId"])
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
	stackID := vars["id"]

	endpointID, err := strconv.Atoi(vars["endpointId"])
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

	handler.stackDeletionMutex.Lock()
	err = handler.StackManager.Remove(stack, endpoint)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
	handler.stackDeletionMutex.Unlock()

	err = handler.StackService.DeleteStack(portainer.StackID(stackID))
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}

	err = handler.FileService.RemoveDirectory(stack.ProjectPath)
	if err != nil {
		httperror.WriteErrorResponse(w, err, http.StatusInternalServerError, handler.Logger)
		return
	}
}

func (handler *StackHandler) deployStack(config *stackDeploymentConfig) error {
	handler.stackCreationMutex.Lock()

	handler.StackManager.Login(config.dockerhub, config.registries, config.endpoint)

	err := handler.StackManager.Deploy(config.stack, config.prune, config.endpoint)
	if err != nil {
		handler.stackCreationMutex.Unlock()
		return err
	}

	err = handler.StackManager.Logout(config.endpoint)
	if err != nil {
		handler.stackCreationMutex.Unlock()
		return err
	}

	handler.stackCreationMutex.Unlock()
	return nil
}
