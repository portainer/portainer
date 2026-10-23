package compose

import (
	"context"
	"errors"
	"fmt"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/libstack"

	"github.com/compose-spec/compose-go/v2/cli"
	"github.com/compose-spec/compose-go/v2/types"
	"github.com/docker/cli/cli/command"
	cmdcompose "github.com/docker/compose/v2/cmd/compose"
	"github.com/docker/compose/v2/pkg/api"
	"github.com/docker/compose/v2/pkg/compose"
	"github.com/docker/compose/v2/pkg/utils"
	"github.com/rs/zerolog/log"
	"github.com/sirupsen/logrus"
)

const PortainerEdgeStackLabel = "io.portainer.edge_stack_id"

func init() {
	logrus.SetOutput(LogrusToZerologWriter{})
	logrus.SetFormatter(&logrus.TextFormatter{
		DisableTimestamp: true,
	})
}

func (c *ComposeDeployer) withComposeService(
	ctx context.Context,
	filePaths []string,
	options libstack.Options,
	composeFn func(api.Compose, *types.Project) error,
) error {
	return libstack.WithCli(ctx,
		libstack.DockerCliOptions{Host: options.Host, Registries: options.Registries},
		func(ctx context.Context, cli *command.DockerCli) error {
			composeService := c.createComposeServiceFn(cli)

			if len(filePaths) == 0 {
				return composeFn(composeService, nil)
			}

			project, err := createProject(ctx, filePaths, options)
			if err != nil {
				return fmt.Errorf("failed to create compose project: %w", err)
			}

			parallel := 0
			if v, ok := project.Environment[cmdcompose.ComposeParallelLimit]; ok {
				i, err := strconv.Atoi(v)
				if err != nil {
					return fmt.Errorf("%s must be an integer (found: %q)", cmdcompose.ComposeParallelLimit, v)
				}
				parallel = i
			}
			if parallel > 0 {
				composeService.MaxConcurrency(parallel)
			}

			return composeFn(composeService, project)
		})
}

// Deploy creates and starts containers
func (c *ComposeDeployer) Deploy(ctx context.Context, filePaths []string, options libstack.DeployOptions) error {
	return c.withComposeService(ctx, filePaths, options.Options, func(composeService api.Compose, project *types.Project) error {
		addServiceLabels(project, false, options.EdgeStackID)

		project = project.WithoutUnnecessaryResources()

		opts := api.UpOptions{
			Start: api.StartOptions{
				Project: project,
			},
		}
		if options.ForceRecreate {
			opts.Create.Recreate = api.RecreateForce
		}

		opts.Create.RemoveOrphans = options.RemoveOrphans
		if removeOrphans, ok := project.Environment[cmdcompose.ComposeRemoveOrphans]; ok {
			opts.Create.RemoveOrphans = utils.StringToBool(removeOrphans)
		}
		if ignoreOrphans, ok := project.Environment[cmdcompose.ComposeIgnoreOrphans]; ok {
			opts.Create.IgnoreOrphans = utils.StringToBool(ignoreOrphans)
		}

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
	return c.withComposeService(ctx, filePaths, options.Options, func(composeService api.Compose, project *types.Project) error {
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
	if err := libstack.WithCli(ctx,
		libstack.DockerCliOptions{Host: options.Host, Registries: options.Registries},
		func(ctx context.Context, cli *command.DockerCli) error {
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
	if err := c.withComposeService(ctx, filePaths, options, func(composeService api.Compose, project *types.Project) error {
		return composeService.Pull(ctx, project, api.PullOptions{})
	}); err != nil {
		return fmt.Errorf("compose pull operation failed: %w", err)
	}

	log.Info().Msg("Stack pull successful")

	return nil
}

// Validate validates stack file
func (c *ComposeDeployer) Validate(ctx context.Context, filePaths []string, options libstack.Options) error {
	return c.withComposeService(ctx, filePaths, options, func(composeService api.Compose, project *types.Project) error {
		return nil
	})
}

// Config returns the compose file with the paths resolved
func (c *ComposeDeployer) Config(ctx context.Context, filePaths []string, options libstack.Options) ([]byte, error) {
	var payload []byte

	if err := c.withComposeService(ctx, filePaths, options, func(composeService api.Compose, project *types.Project) error {
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

	if err := c.withComposeService(ctx, nil, libstack.Options{}, func(composeService api.Compose, project *types.Project) error {
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
						ID:       id,
						Name:     cs.Labels[api.ProjectLabel],
						ExitCode: cs.ExitCode,
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

func createProject(ctx context.Context, configFilepaths []string, options libstack.Options) (*types.Project, error) {
	var workingDir string
	if len(configFilepaths) > 0 {
		workingDir = filepath.Dir(configFilepaths[0])
	}

	if options.ProjectDir != "" {
		// When relative paths are used in the compose file, the project directory is used as the base path
		workingDir = options.ProjectDir
	}

	var envFiles []string
	if options.EnvFilePath != "" {
		envFiles = append(envFiles, options.EnvFilePath)
	}

	var composeEnvVars []string
	for _, ev := range os.Environ() {
		if strings.HasPrefix(ev, "COMPOSE_") {
			composeEnvVars = append(composeEnvVars, ev)
		}
	}

	projectOptions, err := cli.NewProjectOptions(configFilepaths,
		cli.WithWorkingDirectory(workingDir),
		cli.WithName(options.ProjectName),
		cli.WithoutEnvironmentResolution,
		cli.WithResolvedPaths(!slices.Contains(options.ConfigOptions, "--no-path-resolution")),
		cli.WithEnv(libstack.PortainerEnvVars()),
		cli.WithEnv(composeEnvVars),
		cli.WithEnv(options.Env),
		cli.WithEnvFiles(envFiles...),
		func(o *cli.ProjectOptions) error {
			if len(o.EnvFiles) > 0 {
				return nil
			}

			if fs, ok := o.Environment[cmdcompose.ComposeEnvFiles]; ok {
				o.EnvFiles = strings.Split(fs, ",")
			}
			return nil
		},
		cli.WithDotEnv,
		cli.WithDefaultProfiles(),
		cli.WithConfigFileEnv,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load the compose file options : %w", err)
	}

	project, err := projectOptions.LoadProject(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load the compose file : %w", err)
	}

	// Work around compose path handling
	for i, service := range project.Services {
		for j, envFile := range service.EnvFiles {
			if !filepath.IsAbs(envFile.Path) {
				project.Services[i].EnvFiles[j].Path = filesystem.JoinPaths(workingDir, envFile.Path)
			}
		}
	}

	// Set the services environment variables
	if p, err := project.WithServicesEnvironmentResolved(true); err == nil {
		project = p
	} else {
		return nil, fmt.Errorf("failed to resolve services environment: %w", err)
	}

	if options.BindMountHashEnabled {
		// Set per-service label for bind mount hashes under each service
		if project, err = project.WithServicesTransform(addBindMountHashLabel); err != nil {
			log.Warn().
				Err(err).
				Msg("Failed to set bind mount hash labels, proceeding without them. Stack updates may not be detected when bind-mounted files change")
		}
	}

	return project, nil
}
