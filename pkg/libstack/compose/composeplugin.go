package compose

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"sync"

	"github.com/distribution/reference"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/pkg/libstack"
	retry "github.com/portainer/portainer/pkg/retry"

	"github.com/compose-spec/compose-go/v2/cli"
	"github.com/compose-spec/compose-go/v2/types"
	cerrdefs "github.com/containerd/errdefs"
	"github.com/docker/cli/cli/command"
	configtypes "github.com/docker/cli/cli/config/types"
	"github.com/docker/cli/cli/flags"
	cmdcompose "github.com/docker/compose/v2/cmd/compose"
	"github.com/docker/compose/v2/pkg/api"
	"github.com/docker/compose/v2/pkg/compose"
	"github.com/docker/compose/v2/pkg/utils"
	"github.com/docker/docker/api/types/image"
	registrytypes "github.com/docker/docker/api/types/registry"
	"github.com/docker/docker/pkg/jsonmessage"
	"github.com/docker/docker/registry"
	"github.com/rs/zerolog/log"
	"github.com/segmentio/encoding/json"
	"github.com/sirupsen/logrus"
)

const PortainerEdgeStackLabel = "io.portainer.edge_stack_id"

const portainerEnvVarsPrefix = "PORTAINER_"

var mu sync.Mutex

func init() {
	logrus.SetOutput(LogrusToZerologWriter{})
	logrus.SetFormatter(&logrus.TextFormatter{
		DisableTimestamp: true,
	})
}

func withCli(
	ctx context.Context, //nolint:staticcheck
	options libstack.Options,
	cliFn func(context.Context, *command.DockerCli) error,
) error {
	ctx = context.Background() //nolint:staticcheck

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
	defer logs.CloseAndLogErr(cli.Client())

	for _, r := range options.Registries {
		if r.ServerAddress == "" || r.ServerAddress == registry.DefaultNamespace {
			r.ServerAddress = registry.IndexServer
		}

		cli.ConfigFile().AuthConfigs[r.ServerAddress] = r
	}

	// Docker resolves credentials in the following priority:
	// 1. credHelpers – per-registry credential helpers
	// 2. credsStore  – global credential store used for all registries
	// 3. auths       – inline credentials defined in config.json
	//
	// Many Docker Desktop users (Windows/macOS) have a global credsStore configured
	// by default (e.g. "desktop.exe" on Windows or "osxkeychain" on macOS). These
	// global stores often do not include credentials for the custom registries
	// defined in Portainer stacks, leading to authentication failures.
	//
	// To avoid this, when inline credentials are provided for one or more registries,
	// we intentionally clear the global credsStore. This ensures Docker uses the
	// credentials configured in Portainer instead of falling back to an empty global
	// store.
	//
	// If no inline credentials are configured in Portainer, we keep the credsStore
	// so Docker can still use it as a fallback.
	// credHelpers are not affected as they are external services managed by the user.
	// @ref: https://linear.app/portainer/issue/BE-12237
	if len(options.Registries) > 0 {
		cli.ConfigFile().CredentialsStore = ""
	}

	return cliFn(ctx, cli)
}

func (c *ComposeDeployer) withComposeService(
	ctx context.Context,
	filePaths []string,
	options libstack.Options,
	composeFn func(api.Compose, *types.Project) error,
) error {
	return withCli(ctx, options, func(ctx context.Context, cli *command.DockerCli) error {
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
	if err := withCli(ctx, options.Options, func(ctx context.Context, cli *command.DockerCli) error {
		composeService := compose.NewComposeService(cli)

		return composeService.Down(ctx, projectName, api.DownOptions{RemoveOrphans: true, Volumes: options.Volumes})
	}); err != nil {
		return fmt.Errorf("compose down operation failed: %w", err)
	}

	log.Info().Msg("Stack removal successful")

	return nil
}

// Separator is used for naming components
const separator = "-"

// getImageNameOrDefault computes the default image name for a service
func getImageNameOrDefault(service types.ServiceConfig, projectName string) string {
	imageName := service.Image
	if imageName == "" {
		imageName = projectName + separator + service.Name
	}
	return imageName
}

// encodeRegistryAuth finds the registry credentials for the given image and returns
// the base64-encoded auth string expected by the Docker service API.
// Returns an empty string (no error) when no matching credentials are found.
func encodeRegistryAuth(image string, registries []configtypes.AuthConfig) (string, error) {
	named, err := reference.ParseNormalizedNamed(image)
	if err != nil {
		return "", fmt.Errorf("failed to parse image reference %q: %w", image, err)
	}

	domain := reference.Domain(named)
	if domain == "docker.io" {
		domain = registry.IndexServer
	}

	for _, r := range registries {
		if r.ServerAddress == domain {
			encoded, err := registrytypes.EncodeAuthConfig(registrytypes.AuthConfig{
				Username:      r.Username,
				Password:      r.Password,
				ServerAddress: r.ServerAddress,
				Auth:          r.Auth,
				IdentityToken: r.IdentityToken,
				RegistryToken: r.RegistryToken,
			})
			if err != nil {
				return "", fmt.Errorf("failed to encode auth for registry %s: %w", domain, err)
			}
			return encoded, nil
		}
	}

	return "", nil
}

// Pull pulls images
func (c *ComposeDeployer) Pull(ctx context.Context, filePaths []string, options libstack.Options) error {
	if err := withCli(ctx, options, func(ctx context.Context, cli *command.DockerCli) error {
		project, err := createProject(ctx, filePaths, options)
		if err != nil {
			return fmt.Errorf("failed to create compose project: %w", err)
		}

		for _, s := range project.Services {
			imageName := getImageNameOrDefault(s, project.Name)
			encodedAuth, err := encodeRegistryAuth(imageName, options.Registries)
			if err != nil {
				return fmt.Errorf("failed to encode registry auth: %w", err)
			}

			_, err = retry.RetryWithWarnings("Pull image: "+imageName, retry.Default, func() (string, error) {
				_, err := cli.Client().ImageInspect(ctx, imageName)
				if cerrdefs.IsNotFound(err) {
					reader, err := cli.Client().ImagePull(ctx, imageName, image.PullOptions{
						Platform:     s.Platform,
						RegistryAuth: encodedAuth,
					})
					if err != nil {
						return "", fmt.Errorf("failed to pull image: %w", err)
					}

					defer logs.CloseAndLogErr(reader)

					scanner := bufio.NewScanner(reader)
					for scanner.Scan() {
						message := scanner.Text()
						log.Debug().
							Str("ProjectName", options.ProjectName).
							Str("Host", options.Host).
							Str("Image", imageName).
							Msg(message)

						var m jsonmessage.JSONMessage
						err := json.Unmarshal([]byte(message), &m)
						if err != nil {
							log.Error().
								Err(err).
								Str("ProjectName", options.ProjectName).
								Str("Host", options.Host).
								Str("Image", imageName).
								Msg("ComposeDeployer.Pull: failed to json Unmarshal image pull message.")
							return "", fmt.Errorf("failed to json Unmarshal image pull message: %w", err)
						}

						if m.Error != nil {
							log.Error().
								Err(m.Error).
								Str("ProjectName", options.ProjectName).
								Str("Host", options.Host).
								Str("Image", imageName).
								Msg("ComposeDeployer.Pull: error pulling image")
							return "", fmt.Errorf("error pulling image: %w", m.Error)
						}
					}
					if err := scanner.Err(); err != nil {
						log.Error().
							Err(err).
							Str("ProjectName", options.ProjectName).
							Str("Host", options.Host).
							Str("Image", imageName).
							Msg("ComposeDeployer.Pull: error reading from pull reader")
						return "", fmt.Errorf("error reading from pull reader: %w", err)
					}

					return "", nil
				} else if err != nil {
					return "", fmt.Errorf("failed to inspect image: %w", err)
				} else {
					return "", nil
				}
			})
			if err != nil {
				log.Error().
					Err(err).
					Str("ProjectName", options.ProjectName).
					Str("Host", options.Host).
					Str("Image", imageName).
					Msg("ComposeDeployer.Pull: failed to pull image")
				return fmt.Errorf("failed to pull image: %w", err)
			}
		}
		return nil
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

	var osPortainerEnvVars []string
	var composeEnvVars []string
	for _, ev := range os.Environ() {
		if strings.HasPrefix(ev, portainerEnvVarsPrefix) {
			osPortainerEnvVars = append(osPortainerEnvVars, ev)
		}

		if strings.HasPrefix(ev, "COMPOSE_") {
			composeEnvVars = append(composeEnvVars, ev)
		}
	}

	projectOptions, err := cli.NewProjectOptions(configFilepaths,
		cli.WithWorkingDirectory(workingDir),
		cli.WithName(options.ProjectName),
		cli.WithoutEnvironmentResolution,
		cli.WithResolvedPaths(!slices.Contains(options.ConfigOptions, "--no-path-resolution")),
		cli.WithEnv(osPortainerEnvVars),
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
				project.Services[i].EnvFiles[j].Path = filepath.Join(workingDir, envFile.Path)
			}
		}
	}

	// Set the services environment variables
	if p, err := project.WithServicesEnvironmentResolved(true); err == nil {
		project = p
	} else {
		return nil, fmt.Errorf("failed to resolve services environment: %w", err)
	}

	return project, nil
}
