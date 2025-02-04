package compose

import (
	"context"
	"errors"
	"fmt"
	"maps"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/pkg/libstack"

	"github.com/compose-spec/compose-go/v2/dotenv"
	"github.com/compose-spec/compose-go/v2/loader"
	"github.com/compose-spec/compose-go/v2/types"
	"github.com/docker/cli/cli/command"
	"github.com/docker/cli/cli/flags"
	"github.com/docker/compose/v2/pkg/api"
	"github.com/docker/compose/v2/pkg/compose"
	"github.com/docker/docker/registry"
	"github.com/rs/zerolog/log"
	"github.com/sirupsen/logrus"
)

const PortainerEdgeStackLabel = "io.portainer.edge_stack_id"

var mu sync.Mutex

func init() {
	logrus.SetOutput(&LogrusToZerologWriter{})
	logrus.SetFormatter(&logrus.TextFormatter{
		DisableTimestamp: true,
	})
}

func withCli(
	ctx context.Context,
	options libstack.Options,
	cliFn func(context.Context, *command.DockerCli) error,
) error {
	ctx = context.Background()

	cli, err := command.NewDockerCli(command.WithCombinedStreams(log.Logger))
	if err != nil {
		return fmt.Errorf("unable to create a Docker client: %w", err)
	}

	opts := flags.NewClientOptions()

	if options.Host != "" {
		opts.Hosts = []string{options.Host}
	}

	mu.Lock()
	if err := cli.Initialize(opts); err != nil {
		mu.Unlock()
		return fmt.Errorf("unable to initialize the Docker client: %w", err)
	}
	mu.Unlock()
	defer cli.Client().Close()

	for _, r := range options.Registries {
		if r.ServerAddress == "" || r.ServerAddress == registry.DefaultNamespace {
			r.ServerAddress = registry.IndexServer
		}

		cli.ConfigFile().AuthConfigs[r.ServerAddress] = r
	}

	return cliFn(ctx, cli)
}

func withComposeService(
	ctx context.Context,
	filePaths []string,
	options libstack.Options,
	composeFn func(api.Service, *types.Project) error,
) error {
	return withCli(ctx, options, func(ctx context.Context, cli *command.DockerCli) error {
		composeService := compose.NewComposeService(cli)

		if len(filePaths) == 0 {
			return composeFn(composeService, nil)
		}

		env, err := parseEnvironment(options)
		if err != nil {
			return err
		}

		configDetails := types.ConfigDetails{
			Environment: env,
			WorkingDir:  filepath.Dir(filePaths[0]),
		}

		for _, p := range filePaths {
			configDetails.ConfigFiles = append(configDetails.ConfigFiles, types.ConfigFile{Filename: p})
		}

		project, err := loader.LoadWithContext(ctx, configDetails,
			func(o *loader.Options) {
				o.SkipResolveEnvironment = true
				o.ResolvePaths = !slices.Contains(options.ConfigOptions, "--no-path-resolution")

				if options.ProjectName != "" {
					o.SetProjectName(options.ProjectName, true)
				}
			},
		)
		if err != nil {
			return fmt.Errorf("failed to load the compose file: %w", err)
		}

		// Work around compose path handling
		for i, service := range project.Services {
			for j, envFile := range service.EnvFiles {
				if !filepath.IsAbs(envFile.Path) {
					project.Services[i].EnvFiles[j].Path = filepath.Join(configDetails.WorkingDir, envFile.Path)
				}
			}
		}

		// Set the services environment variables
		if p, err := project.WithServicesEnvironmentResolved(true); err == nil {
			project = p
		} else {
			return fmt.Errorf("failed to resolve services environment: %w", err)
		}

		return composeFn(composeService, project)
	})
}

// Deploy creates and starts containers
func (c *ComposeDeployer) Deploy(ctx context.Context, filePaths []string, options libstack.DeployOptions) error {
	return withComposeService(ctx, filePaths, options.Options, func(composeService api.Service, project *types.Project) error {
		addServiceLabels(project, false, options.EdgeStackID)

		project = project.WithoutUnnecessaryResources()

		var opts api.UpOptions
		if options.ForceRecreate {
			opts.Create.Recreate = api.RecreateForce
		}

		opts.Create.RemoveOrphans = options.RemoveOrphans

		if options.AbortOnContainerExit {
			opts.Start.OnExit = api.CascadeStop
		}

		if err := composeService.Build(ctx, project, api.BuildOptions{}); err != nil {
			return fmt.Errorf("compose build operation failed: %w", err)
		}

		if err := composeService.Up(ctx, project, opts); err != nil {
			return fmt.Errorf("compose up operation failed: %w", err)
		}

		log.Info().Msg("Stack deployment successful")

		return nil
	})
}

// Run runs the given service just once, without considering dependencies
func (c *ComposeDeployer) Run(ctx context.Context, filePaths []string, serviceName string, options libstack.RunOptions) error {
	return withComposeService(ctx, filePaths, options.Options, func(composeService api.Service, project *types.Project) error {
		addServiceLabels(project, true, 0)

		for name, service := range project.Services {
			if name == serviceName {
				project.DisabledServices[serviceName] = service
			}
		}

		project.Services = make(types.Services)

		if err := composeService.Create(ctx, project, api.CreateOptions{RemoveOrphans: true}); err != nil {
			return fmt.Errorf("compose create operation failed: %w", err)
		}

		maps.Copy(project.Services, project.DisabledServices)
		project.DisabledServices = make(types.Services)

		opts := api.RunOptions{
			AutoRemove: options.Remove,
			Command:    options.Args,
			Detach:     options.Detached,
			Service:    serviceName,
		}

		if _, err := composeService.RunOneOffContainer(ctx, project, opts); err != nil {
			return fmt.Errorf("compose run operation failed: %w", err)
		}

		log.Info().Msg("Stack run successful")

		return nil
	})
}

// Remove stops and removes containers
func (c *ComposeDeployer) Remove(ctx context.Context, projectName string, filePaths []string, options libstack.RemoveOptions) error {
	if err := withCli(ctx, options.Options, func(ctx context.Context, cli *command.DockerCli) error {
		composeService := compose.NewComposeService(cli)

		return composeService.Down(ctx, projectName, api.DownOptions{RemoveOrphans: true, Volumes: options.Volumes})
	}); err != nil {
		return fmt.Errorf("compose down operation failed: %w", err)
	}

	log.Info().Msg("Stack removal successful")

	return nil
}

// Pull pulls images
func (c *ComposeDeployer) Pull(ctx context.Context, filePaths []string, options libstack.Options) error {
	if err := withComposeService(ctx, filePaths, options, func(composeService api.Service, project *types.Project) error {
		return composeService.Pull(ctx, project, api.PullOptions{})
	}); err != nil {
		return fmt.Errorf("compose pull operation failed: %w", err)
	}

	log.Info().Msg("Stack pull successful")

	return nil
}

// Validate validates stack file
func (c *ComposeDeployer) Validate(ctx context.Context, filePaths []string, options libstack.Options) error {
	return withComposeService(ctx, filePaths, options, func(composeService api.Service, project *types.Project) error {
		return nil
	})
}

// Config returns the compose file with the paths resolved
func (c *ComposeDeployer) Config(ctx context.Context, filePaths []string, options libstack.Options) ([]byte, error) {
	var payload []byte

	if err := withComposeService(ctx, filePaths, options, func(composeService api.Service, project *types.Project) error {
		var err error
		payload, err = project.MarshalYAML()
		if err != nil {
			return fmt.Errorf("unable to marshal as YAML: %w", err)
		}

		return nil
	}); err != nil {
		return nil, fmt.Errorf("compose config operation failed: %w", err)
	}

	return payload, nil
}

func (c *ComposeDeployer) GetExistingEdgeStacks(ctx context.Context) ([]libstack.EdgeStack, error) {
	m := make(map[int]libstack.EdgeStack)

	if err := withComposeService(ctx, nil, libstack.Options{}, func(composeService api.Service, project *types.Project) error {
		stacks, err := composeService.List(ctx, api.ListOptions{
			All: true,
		})
		if err != nil {
			return err
		}

		for _, s := range stacks {
			summary, err := composeService.Ps(ctx, s.Name, api.PsOptions{All: true})
			if err != nil {
				return err
			}

			for _, cs := range summary {
				if sid, ok := cs.Labels[PortainerEdgeStackLabel]; ok {
					id, err := strconv.Atoi(sid)
					if err != nil {
						return err
					}

					if cs.Labels[api.ProjectLabel] == "" {
						return errors.New("invalid project label")
					}

					m[id] = libstack.EdgeStack{
						ID:   id,
						Name: cs.Labels[api.ProjectLabel],
					}
				}
			}
		}

		return nil
	}); err != nil {
		return nil, err
	}

	return slices.Collect(maps.Values(m)), nil
}

func addServiceLabels(project *types.Project, oneOff bool, edgeStackID portainer.EdgeStackID) {
	oneOffLabel := "False"
	if oneOff {
		oneOffLabel = "True"
	}

	for i, s := range project.Services {
		s.CustomLabels = map[string]string{
			api.ProjectLabel:     project.Name,
			api.ServiceLabel:     s.Name,
			api.VersionLabel:     api.ComposeVersion,
			api.WorkingDirLabel:  project.WorkingDir,
			api.ConfigFilesLabel: strings.Join(project.ComposeFiles, ","),
			api.OneoffLabel:      oneOffLabel,
		}

		if edgeStackID > 0 {
			s.CustomLabels.Add(PortainerEdgeStackLabel, strconv.Itoa(int(edgeStackID)))
		}

		project.Services[i] = s
	}
}

func parseEnvironment(options libstack.Options) (map[string]string, error) {
	env := make(map[string]string)

	for _, envLine := range options.Env {
		e, err := dotenv.UnmarshalWithLookup(envLine, nil)
		if err != nil {
			return nil, fmt.Errorf("unable to parse environment variables: %w", err)
		}

		maps.Copy(env, e)
	}

	if options.EnvFilePath == "" {
		return env, nil
	}

	e, err := dotenv.GetEnvFromFile(make(map[string]string), []string{options.EnvFilePath})
	if err != nil {
		return nil, fmt.Errorf("unable to get the environment from the env file: %w", err)
	}

	maps.Copy(env, e)

	return env, nil
}
