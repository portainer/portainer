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

// Up will execute the Up operation against a stack inside the specified endpoint.
func (manager *StackManager) Up(stack *portainer.Stack, endpoint *portainer.Endpoint) error {

	//TODO: clientFactory should be stored once created for an endpoint
	clientFactory, err := client.NewDefaultFactory(client.Options{
		TLS:         endpoint.TLS,
		TLSVerify:   endpoint.TLS,
		Host:        endpoint.URL,
		TLSCAFile:   endpoint.TLSCACertPath,
		TLSCertFile: endpoint.TLSCertPath,
		TLSKeyFile:  endpoint.TLSKeyPath,
		APIVersion:  "1.30",
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

// Down will execute the Down operation against a stack inside the specified endpoint.
func (manager *StackManager) Down(stack *portainer.Stack, endpoint *portainer.Endpoint) error {

	//TODO: clientFactory should be stored once created for an endpoint
	clientFactory, err := client.NewDefaultFactory(client.Options{
		TLS:         endpoint.TLS,
		TLSVerify:   endpoint.TLS,
		Host:        endpoint.URL,
		TLSCAFile:   endpoint.TLSCACertPath,
		TLSCertFile: endpoint.TLSCertPath,
		TLSKeyFile:  endpoint.TLSKeyPath,
		APIVersion:  "1.30",
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

	return project.Down(context.Background(), options.Down{})
}

// Scale will execute the scale operation against a stack service inside the specified endpoint.
func (manager *StackManager) Scale(stack *portainer.Stack, endpoint *portainer.Endpoint, service string, scale int) error {

	//TODO: clientFactory should be stored once created for an endpoint
	clientFactory, err := client.NewDefaultFactory(client.Options{
		TLS:         endpoint.TLS,
		TLSVerify:   endpoint.TLS,
		Host:        endpoint.URL,
		TLSCAFile:   endpoint.TLSCACertPath,
		TLSCertFile: endpoint.TLSCertPath,
		TLSKeyFile:  endpoint.TLSKeyPath,
		APIVersion:  "1.30",
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

	serviceScale := map[string]int{service: scale}
	return project.Scale(context.Background(), 30, serviceScale)
}
