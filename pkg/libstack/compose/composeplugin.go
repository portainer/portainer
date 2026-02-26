package compose

import (
	"archive/tar"
	"context"
	"errors"
	"fmt"
	"io"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"sync"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/pkg/libstack"

	"github.com/compose-spec/compose-go/v2/cli"
	"github.com/compose-spec/compose-go/v2/types"
	"github.com/docker/cli/cli/command"
	"github.com/docker/cli/cli/flags"
	cmdcompose "github.com/docker/compose/v2/cmd/compose"
	"github.com/docker/compose/v2/pkg/api"
	"github.com/docker/compose/v2/pkg/compose"
	"github.com/docker/compose/v2/pkg/utils"
	buildtypes "github.com/docker/docker/api/types/build"
	"github.com/docker/docker/registry"
	"github.com/rs/zerolog/log"
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

// withComposeServiceFull initialises the Docker CLI and compose service, then
// calls composeFn with both the CLI and the compose service. Use this when the
// caller needs direct Docker API access alongside the compose service (e.g. to
// call client.ImageBuild instead of composeService.Build).
func (c *ComposeDeployer) withComposeServiceFull(
	ctx context.Context,
	filePaths []string,
	options libstack.Options,
	composeFn func(*command.DockerCli, api.Compose, *types.Project) error,
) error {
	return withCli(ctx, options, func(ctx context.Context, cli *command.DockerCli) error {
		composeService := c.createComposeServiceFn(cli)

		if len(filePaths) == 0 {
			return composeFn(cli, composeService, nil)
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

		return composeFn(cli, composeService, project)
	})
}

func (c *ComposeDeployer) withComposeService(
	ctx context.Context,
	filePaths []string,
	options libstack.Options,
	composeFn func(api.Compose, *types.Project) error,
) error {
	return c.withComposeServiceFull(ctx, filePaths, options, func(_ *command.DockerCli, cs api.Compose, p *types.Project) error {
		return composeFn(cs, p)
	})
}

// Deploy creates and starts containers
func (c *ComposeDeployer) Deploy(ctx context.Context, filePaths []string, options libstack.DeployOptions) error {
	return c.withComposeServiceFull(ctx, filePaths, options.Options, func(cli *command.DockerCli, composeService api.Compose, project *types.Project) error {
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

		// For remote Docker hosts, bypass the buildx driver selection path and use
		// the classic POST /build API directly. The buildx path probes /grpc via
		// DialHijack (HTTP upgrade); when that probe fails through Portainer's proxy
		// layer, the docker-container driver is chosen and subsequently fails with
		// "unable to upgrade to tcp, received 200" during exec/attach.
		// See: https://github.com/portainer/portainer/issues/12754
		if options.Host != "" {
			if err := buildServicesClassic(ctx, cli, project); err != nil {
				return fmt.Errorf("compose build operation failed: %w", err)
			}
		} else {
			if err := composeService.Build(ctx, project, api.BuildOptions{}); err != nil {
				return fmt.Errorf("compose build operation failed: %w", err)
			}
		}

		if err := composeService.Up(ctx, project, opts); err != nil {
			return fmt.Errorf("compose up operation failed: %w", err)
		}

		log.Info().Msg("Stack deployment successful")

		return nil
	})
}

// buildServicesClassic builds each compose service that declares a build section
// using the Docker daemon's classic POST /build API. Unlike the buildx path,
// this API uses a plain HTTP request with a tar body — no HTTP upgrade (TCP hijack)
// is required, so it works through Portainer's remote Docker proxy layer.
//
// Limitations vs. composeService.Build():
//   - .dockerignore is not applied client-side (the daemon handles unknown files)
//   - Symlinks in the build context are not followed
//   - BuildKit-only features (cache mounts, SSH, secrets, multi-platform) are unavailable
func buildServicesClassic(ctx context.Context, cli *command.DockerCli, project *types.Project) error {
	for _, service := range project.Services {
		if service.Build == nil {
			continue
		}

		imageName := service.Image
		if imageName == "" {
			imageName = project.Name + "-" + service.Name
		}

		buildOpts := buildtypes.ImageBuildOptions{
			Tags:       []string{imageName},
			Dockerfile: service.Build.Dockerfile,
			BuildArgs:  map[string]*string(service.Build.Args),
			Target:     service.Build.Target,
			Labels:     map[string]string(service.Build.Labels),
			Remove:     true,
		}

		contextPath := service.Build.Context
		if contextPath == "" {
			contextPath = project.WorkingDir
		}
		if !filepath.IsAbs(contextPath) {
			contextPath = filepath.Join(project.WorkingDir, contextPath)
		}

		// URL-based contexts (git://, http://, https://) are fetched server-side.
		if strings.Contains(contextPath, "://") {
			buildOpts.RemoteContext = contextPath
			resp, err := cli.Client().ImageBuild(ctx, nil, buildOpts)
			if err != nil {
				return fmt.Errorf("service %s: remote context build failed: %w", service.Name, err)
			}
			_, _ = io.Copy(io.Discard, resp.Body)
			_ = resp.Body.Close()
			continue
		}

		// Local directory context: stream a tar to the daemon.
		buildCtx, err := tarDirectory(contextPath)
		if err != nil {
			return fmt.Errorf("service %s: failed to create build context: %w", service.Name, err)
		}

		resp, err := cli.Client().ImageBuild(ctx, buildCtx, buildOpts)
		_ = buildCtx.Close()
		if err != nil {
			return fmt.Errorf("service %s: build failed: %w", service.Name, err)
		}
		_, _ = io.Copy(io.Discard, resp.Body)
		_ = resp.Body.Close()
	}

	return nil
}

// tarDirectory streams a directory as an uncompressed tar archive via an io.Pipe.
func tarDirectory(dir string) (io.ReadCloser, error) {
	if _, err := os.Stat(dir); err != nil {
		return nil, err
	}

	pr, pw := io.Pipe()
	go func() {
		tw := tar.NewWriter(pw)
		err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			rel, err := filepath.Rel(dir, path)
			if err != nil {
				return err
			}
			if rel == "." {
				return nil
			}
			hdr, err := tar.FileInfoHeader(info, "")
			if err != nil {
				return err
			}
			hdr.Name = rel
			if err := tw.WriteHeader(hdr); err != nil {
				return err
			}
			if info.IsDir() {
				return nil
			}
			f, err := os.Open(path)
			if err != nil {
				return err
			}
			defer f.Close() //nolint:errcheck
			_, err = io.Copy(tw, f)
			return err
		})
		if err != nil {
			pw.CloseWithError(err)
			return
		}
		pw.CloseWithError(tw.Close())
	}()

	return pr, nil
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

	var osPortainerEnvVars []string
	for _, ev := range os.Environ() {
		if strings.HasPrefix(ev, portainerEnvVarsPrefix) {
			osPortainerEnvVars = append(osPortainerEnvVars, ev)
		}
	}

	projectOptions, err := cli.NewProjectOptions(configFilepaths,
		cli.WithWorkingDirectory(workingDir),
		cli.WithName(options.ProjectName),
		cli.WithoutEnvironmentResolution,
		cli.WithResolvedPaths(!slices.Contains(options.ConfigOptions, "--no-path-resolution")),
		cli.WithEnv(osPortainerEnvVars),
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
