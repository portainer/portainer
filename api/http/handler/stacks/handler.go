package stacks

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/docker/docker/api/types"
	"github.com/gorilla/mux"
	"github.com/pkg/errors"
	httperror "github.com/portainer/libhttp/error"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks"
)

const defaultGitReferenceName = "refs/heads/master"

var (
	errStackAlreadyExists     = errors.New("A stack already exists with this name")
	errWebhookIDAlreadyExists = errors.New("A webhook ID already exists")
	errStackNotExternal       = errors.New("Not an external stack")
)

// Handler is the HTTP handler used to handle stack operations.
type Handler struct {
	stackCreationMutex *sync.Mutex
	stackDeletionMutex *sync.Mutex
	requestBouncer     *security.RequestBouncer
	*mux.Router
	DataStore               dataservices.DataStore
	DockerClientFactory     *docker.ClientFactory
	FileService             portainer.FileService
	GitService              portainer.GitService
	SwarmStackManager       portainer.SwarmStackManager
	ComposeStackManager     portainer.ComposeStackManager
	KubernetesDeployer      portainer.KubernetesDeployer
	KubernetesClientFactory *cli.ClientFactory
	Scheduler               *scheduler.Scheduler
	StackDeployer           stacks.StackDeployer
}

func stackExistsError(name string) *httperror.HandlerError {
	msg := fmt.Sprintf("A stack with the normalized name '%s' already exists", name)
	err := errors.New(msg)
	return &httperror.HandlerError{StatusCode: http.StatusConflict, Message: msg, Err: err}
}

// NewHandler creates a handler to manage stack operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router:             mux.NewRouter(),
		stackCreationMutex: &sync.Mutex{},
		stackDeletionMutex: &sync.Mutex{},
		requestBouncer:     bouncer,
	}
	h.Handle("/stacks",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackCreate))).Methods(http.MethodPost)
	h.Handle("/stacks",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackList))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackInspect))).Methods(http.MethodGet)
	h.Handle("/stacks/{id}",
		bouncer.AuthenticatedAccess(httperror.LoggerHandler(h.stackDelete))).Methods(http.MethodDelete)
	h.Handle("/stacks/{id}/associate",
		bouncer.AdminAccess(httperror.LoggerHandler(h.stackAssociate))).Methods(http.MethodPut)
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
		httperror.LoggerHandler(h.webhookInvoke)).Methods(http.MethodPost)

	return h
}

func (handler *Handler) userCanAccessStack(securityContext *security.RestrictedRequestContext, endpointID portainer.EndpointID, resourceControl *portainer.ResourceControl) (bool, error) {
	user, err := handler.DataStore.User().User(securityContext.UserID)
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

	return handler.userIsAdminOrEndpointAdmin(user, endpointID)
}

func (handler *Handler) userIsAdmin(userID portainer.UserID) (bool, error) {
	user, err := handler.DataStore.User().User(userID)
	if err != nil {
		return false, err
	}

	isAdmin := user.Role == portainer.AdministratorRole

	return isAdmin, nil
}

func (handler *Handler) userIsAdminOrEndpointAdmin(user *portainer.User, endpointID portainer.EndpointID) (bool, error) {
	isAdmin := user.Role == portainer.AdministratorRole

	return isAdmin, nil
}

func (handler *Handler) userCanCreateStack(securityContext *security.RestrictedRequestContext, endpointID portainer.EndpointID) (bool, error) {
	user, err := handler.DataStore.User().User(securityContext.UserID)
	if err != nil {
		return false, err
	}

	return handler.userIsAdminOrEndpointAdmin(user, endpointID)
}

func (handler *Handler) checkUniqueStackName(endpoint *portainer.Endpoint, name string, stackID portainer.StackID) (bool, error) {
	stacks, err := handler.DataStore.Stack().Stacks()
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

func (handler *Handler) checkUniqueStackNameInKubernetes(endpoint *portainer.Endpoint, name string, stackID portainer.StackID, namespace string) (bool, error) {
	isUniqueStackName, err := handler.checkUniqueStackName(endpoint, name, stackID)
	if err != nil {
		return false, err
	}

	if !isUniqueStackName {
		// Check if this stack name is really used in the kubernetes.
		// Because the stack with this name could be removed via kubectl cli outside and the datastore does not be informed of this action.
		if namespace == "" {
			namespace = "default"
		}

		kubeCli, err := handler.KubernetesClientFactory.GetKubeClient(endpoint)
		if err != nil {
			return false, err
		}
		isUniqueStackName, err = kubeCli.HasStackName(namespace, name)
		if err != nil {
			return false, err
		}
	}
	return isUniqueStackName, nil
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

	containers, err := dockerClient.ContainerList(context.Background(), types.ContainerListOptions{All: true})
	if err != nil {
		return false, err
	}

	for _, container := range containers {
		containerNS, ok := container.Labels["com.docker.compose.project"]

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

func (handler *Handler) clone(projectPath, repositoryURL, refName string, auth bool, username, password string) error {
	if !auth {
		username = ""
		password = ""
	}

	err := handler.GitService.CloneRepository(projectPath, repositoryURL, refName, username, password)
	if err != nil {
		return fmt.Errorf("unable to clone git repository: %w", err)
	}

	return nil
}

func (handler *Handler) latestCommitID(repositoryURL, refName string, auth bool, username, password string) (string, error) {
	if !auth {
		username = ""
		password = ""
	}

	return handler.GitService.LatestCommitID(repositoryURL, refName, username, password)
}
