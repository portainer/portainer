package stacks

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/docker/consts"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/api/stacks/stackutils"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/gorilla/mux"
	"github.com/pkg/errors"
)

// Handler is the HTTP handler used to handle stack operations.
type Handler struct {
	stackCreationMutex *sync.Mutex
	stackDeletionMutex *sync.Mutex
	requestBouncer     security.BouncerService
	*mux.Router
	DataStore               dataservices.DataStore
	DockerClientFactory     *dockerclient.ClientFactory
	FileService             portainer.FileService
	GitService              portainer.GitService
	SwarmStackManager       portainer.SwarmStackManager
	ComposeStackManager     portainer.ComposeStackManager
	KubernetesDeployer      portainer.KubernetesDeployer
	KubernetesClientFactory *cli.ClientFactory
	Scheduler               *scheduler.Scheduler
	StackDeployer           deployments.StackDeployer
}

func stackExistsError(name string) *httperror.HandlerError {
	msg := fmt.Sprintf("A stack with the normalized name '%s' already exists", name)
	err := errors.New(msg)
	return httperror.Conflict(msg, err)
}

// NewHandler creates a handler to manage stack operations.
func NewHandler(bouncer security.BouncerService) *Handler {
	h := &Handler{
		Router:             mux.NewRouter(),
		stackCreationMutex: &sync.Mutex{},
		stackDeletionMutex: &sync.Mutex{},
		requestBouncer:     bouncer,
	}

	h.Handle("/stacks/create/{type}/{method}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackCreate))).Methods(http.MethodPost)
	h.Handle("/stacks",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackList))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackInspect))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackDelete))).Methods(http.MethodDelete)
	h.Handle("/stacks/{id}/associate",
		bouncer.AdminAccess(httperror.LoggerHandler(h.stackAssociate))).Methods(http.MethodPut)
	h.Handle("/stacks/name/{name}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackDeleteKubernetesByName))).Methods(http.MethodDelete)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackUpdate))).Methods(http.MethodPut)
	h.Handle("/stacks/{id}/git",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackUpdateGit))).Methods(http.MethodPost)
	h.Handle("/stacks/{id}/git/redeploy",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackGitRedeploy))).Methods(http.MethodPut)
	h.Handle("/stacks/{id}/file",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackFile))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}/migrate",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackMigrate))).Methods(http.MethodPost)
	h.Handle("/stacks/{id}/start",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackStart))).Methods(http.MethodPost)
	h.Handle("/stacks/{id}/stop",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackStop))).Methods(http.MethodPost)
	h.Handle("/stacks/webhooks/{webhookID}",
		bouncer.PublicAccess(httperror.LoggerHandler(h.webhookInvoke))).Methods(http.MethodPost)

	return h
}

func (handler *Handler) userCanAccessStack(securityContext *security.RestrictedRequestContext, endpointID portainer.EndpointID, resourceControl *portainer.ResourceControl) (bool, error) {
	user, err := handler.DataStore.User().Read(securityContext.UserID)
	if err != nil {
		return false, err
	}

	userTeamIDs := make([]portainer.TeamID, 0)
	for _, membership := range securityContext.UserMemberships {
		userTeamIDs = append(userTeamIDs, membership.TeamID)
	}

	if resourceControl != nil && authorization.UserCanAccessResource(securityContext.UserID, userTeamIDs, resourceControl) {
		return true, nil
	}

	return stackutils.UserIsAdminOrEndpointAdmin(user, endpointID)
}

func (handler *Handler) userIsAdmin(userID portainer.UserID) (bool, error) {
	user, err := handler.DataStore.User().Read(userID)
	if err != nil {
		return false, err
	}

	isAdmin := user.Role == portainer.AdministratorRole

	return isAdmin, nil
}

func (handler *Handler) userCanCreateStack(securityContext *security.RestrictedRequestContext, endpointID portainer.EndpointID) (bool, error) {
	user, err := handler.DataStore.User().Read(securityContext.UserID)
	if err != nil {
		return false, err
	}

	return stackutils.UserIsAdminOrEndpointAdmin(user, endpointID)
}

// if stack management is disabled for non admins and the user isn't an admin, then return false. Otherwise return true
func (handler *Handler) userCanManageStacks(securityContext *security.RestrictedRequestContext, endpoint *portainer.Endpoint) (bool, error) {
	// When the endpoint is deleted, stacks that the deleted endpoint created will be tagged as an orphan stack
	// An orphan stack can be adopted by admins
	if endpoint == nil {
		return true, nil
	}

	if endpointutils.IsDockerEndpoint(endpoint) && !endpoint.SecuritySettings.AllowStackManagementForRegularUsers {
		canCreate, err := handler.userCanCreateStack(securityContext, endpoint.ID)

		if err != nil {
			return false, fmt.Errorf("failed to get user from the database: %w", err)
		}

		return canCreate, nil
	}
	return true, nil
}

func (handler *Handler) checkUniqueStackName(endpoint *portainer.Endpoint, name string, stackID portainer.StackID) (bool, error) {
	stacks, err := handler.DataStore.Stack().ReadAll()
	if err != nil {
		return false, err
	}

	for _, stack := range stacks {
		if strings.EqualFold(stack.Name, name) && (stackID == 0 || stackID != stack.ID) && stack.EndpointID == endpoint.ID {
			return false, nil
		}
	}

	return true, nil
}

func (handler *Handler) checkUniqueStackNameInDocker(endpoint *portainer.Endpoint, name string, stackID portainer.StackID, swarmMode bool) (bool, error) {
	isUniqueStackName, err := handler.checkUniqueStackName(endpoint, name, stackID)
	if err != nil {
		return false, err
	}

	dockerClient, err := handler.DockerClientFactory.CreateClient(endpoint, "", nil)
	if err != nil {
		return false, err
	}
	defer dockerClient.Close()
	if swarmMode {
		services, err := dockerClient.ServiceList(context.Background(), types.ServiceListOptions{})
		if err != nil {
			return false, err
		}

		for _, service := range services {
			serviceNS, ok := service.Spec.Labels["com.docker.stack.namespace"]
			if ok && serviceNS == name {
				return false, nil
			}
		}
	}

	containers, err := dockerClient.ContainerList(context.Background(), container.ListOptions{All: true})
	if err != nil {
		return false, err
	}

	for _, container := range containers {
		containerNS, ok := container.Labels[consts.ComposeStackNameLabel]

		if ok && containerNS == name {
			return false, nil
		}
	}

	return isUniqueStackName, nil
}

func (handler *Handler) checkUniqueWebhookID(webhookID string) (bool, error) {
	_, err := handler.DataStore.Stack().StackByWebhookID(webhookID)
	if handler.DataStore.IsErrObjectNotFound(err) {
		return true, nil
	}
	return false, err
}
