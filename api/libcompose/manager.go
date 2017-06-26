package libcompose

import (
	"path"
	"path/filepath"

	"github.com/portainer/portainer"

	"github.com/portainer/libcompose/config"
	"github.com/portainer/libcompose/docker"
	"github.com/portainer/libcompose/docker/client"
	"github.com/portainer/libcompose/docker/ctx"
	"github.com/portainer/libcompose/lookup"
	"github.com/portainer/libcompose/project"
	"github.com/portainer/libcompose/project/options"
	"golang.org/x/net/context"
)

// StackManager represents a service for managing stacks.
type StackManager struct{}

// NewStackManager initializes a new StackManager service.
func NewStackManager() *StackManager {
	return &StackManager{}
}

// Start will start a stack inside the specified endpoint.
func (manager *StackManager) Start(stack *portainer.Stack, endpoint *portainer.Endpoint) error {

	//TODO: clientFactory should be stored once created for an endpoint
	clientFactory, err := client.NewDefaultFactory(client.Options{
		TLS:         endpoint.TLS,
		TLSVerify:   endpoint.TLS,
		Host:        endpoint.URL,
		TLSCAFile:   endpoint.TLSCACertPath,
		TLSCertFile: endpoint.TLSCertPath,
		TLSKeyFile:  endpoint.TLSKeyPath,
	})
	if err != nil {
		return err
	}

	composeFilePath := path.Join(stack.ProjectPath, "docker-compose.yml")
	project, err := docker.NewProject(&ctx.Context{
		Context: project.Context{
			ComposeFiles: []string{composeFilePath},
			EnvironmentLookup: &lookup.ComposableEnvLookup{
				Lookups: []config.EnvironmentLookup{
					&lookup.EnvfileLookup{
						Path: filepath.Join(stack.ProjectPath, ".env"),
					},
					&lookup.OsEnvLookup{},
				},
			},
			ProjectName: stack.Name,
		},
		ClientFactory: clientFactory,
	}, nil)

	if err != nil {
		return err
	}

	return project.Up(context.Background(), options.Up{})
}
