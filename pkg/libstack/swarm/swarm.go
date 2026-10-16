package swarm

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/libstack"

	"github.com/containerd/errdefs"
	"github.com/distribution/reference"
	"github.com/docker/cli/cli/command"

	"github.com/docker/cli/cli/compose/convert"
	composeloader "github.com/docker/cli/cli/compose/loader"
	"github.com/docker/cli/cli/compose/schema"
	composetypes "github.com/docker/cli/cli/compose/types"
	configtypes "github.com/docker/cli/cli/config/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/network"
	registrytypes "github.com/docker/docker/api/types/registry"
	"github.com/docker/docker/api/types/swarm"
	"github.com/docker/docker/client"
	dockerregistry "github.com/docker/docker/registry"
	"github.com/rs/zerolog/log"
)

// ManagerOperationHeader forces the Portainer agent to route requests to a swarm
// manager node. Swarm-scoped operations (e.g. network create/remove) fail on worker
// nodes without it. This constant is originally defined in the agent, see package/agent/README.md.
const ManagerOperationHeader = "X-PortainerAgent-ManagerOperation"

// cliOptions builds the Docker CLI options for swarm operations, always setting the
// manager-operation header so requests proxied through an agent target a manager node.
func cliOptions(host string, registries []configtypes.AuthConfig) libstack.DockerCliOptions {
	return libstack.DockerCliOptions{
		Host:       host,
		Registries: registries,
		Headers:    map[string]string{ManagerOperationHeader: "1"},
	}
}

// Options holds connection and credential settings for swarm operations.
type Options struct {
	ProjectName string
	Host        string
	Env         []string
	WorkingDir  string
	Registries  []configtypes.AuthConfig
}

// DeployOptions extends Options with deployment-specific settings.
type DeployOptions struct {
	Options
	RemoveOrphans bool
	// PullImage controls how image digests are resolved on deploy:
	//   true  - query the registry (ResolveImageAlways)
	//   false - never contact the registry; reuse the existing digest (ResolveImageNever)
	PullImage bool
	// ForceRecreate increments ForceUpdate on every existing service so that
	// Docker re-schedules all tasks even when nothing in the spec has changed.
	ForceRecreate bool
}

// RemoveOptions extends Options with removal settings.
type RemoveOptions struct {
	Options
}

// Deployer is the interface for in-process Docker Swarm stack management.
type Deployer interface {
	Deploy(ctx context.Context, filePaths []string, options DeployOptions) error
	Remove(ctx context.Context, projectName string, options RemoveOptions) error
	Validate(ctx context.Context, filePaths []string, options Options) error
	WaitForStatus(ctx context.Context, projectName string, options Options, status libstack.Status) libstack.WaitResult
}

// SwarmDeployer implements Deployer using the Docker API in-process.
type SwarmDeployer struct{}

// NewSwarmDeployer creates a new SwarmDeployer.
func NewSwarmDeployer() *SwarmDeployer { return &SwarmDeployer{} }

// Deploy creates or updates a Docker Swarm stack from the given compose files.
func (d *SwarmDeployer) Deploy(ctx context.Context, filePaths []string, options DeployOptions) error {
	// WithCli replaces the context with Background internally, so we capture the
	// caller's context here to preserve cancellation.
	callerCtx := ctx

	return libstack.WithCli(
		ctx,
		cliOptions(options.Host, options.Registries),
		func(_ context.Context, dockerCLI *command.DockerCli) error {
			return deployStack(callerCtx, dockerCLI, filePaths, options)
		})
}

// Validate loads and parses the compose file(s), returning an error if they are invalid.
func (d *SwarmDeployer) Validate(_ context.Context, filePaths []string, options Options) error {
	_, err := getConfig(filePaths, options.WorkingDir, options.Env)
	return err
}

// Remove deletes all resources belonging to a Swarm stack and waits for tasks to terminate.
func (d *SwarmDeployer) Remove(ctx context.Context, projectName string, options RemoveOptions) error {
	// WithCli replaces the context with Background internally, so we capture the
	// caller's context here to preserve cancellation.
	callerCtx := ctx

	return libstack.WithCli(
		ctx,
		cliOptions(options.Host, options.Registries),
		func(_ context.Context, dockerCLI *command.DockerCli) error {
			apiClient := dockerCLI.Client()

			services, err := getStackServices(callerCtx, apiClient, projectName)
			if err != nil {
				return err
			}

			secrets, err := getStackSecrets(callerCtx, apiClient, projectName)
			if err != nil {
				return err
			}

			configs, err := getStackConfigs(callerCtx, apiClient, projectName)
			if err != nil {
				return err
			}

			networks, err := getStackNetworks(callerCtx, apiClient, projectName)
			if err != nil {
				return err
			}

			if len(services)+len(secrets)+len(configs)+len(networks) == 0 {
				log.Info().Str("stack", projectName).Msg("nothing found in stack")
				return nil
			}

			var errs []error

			if err := removeServices(callerCtx, apiClient, services); err != nil {
				errs = append(errs, err)
			}

			if err := removeSecrets(callerCtx, apiClient, secrets); err != nil {
				errs = append(errs, err)
			}

			if err := removeConfigs(callerCtx, apiClient, configs); err != nil {
				errs = append(errs, err)
			}

			if err := removeNetworks(callerCtx, apiClient, networks); err != nil {
				errs = append(errs, err)
			}

			if len(errs) > 0 {
				return errors.Join(errs...)
			}

			// Wait for all tasks to reach a terminal state before returning, mirroring
			// the behaviour of `docker stack rm --detach=false`.
			return waitOnTasks(callerCtx, apiClient, projectName)
		})
}

// deployStack is the core stack deployment logic.
// It reimplements `docker stack deploy` in-process using the docker/cli compose loader and
// convert packages. Reference: https://github.com/docker/cli/blob/v28.5.2/cli/command/stack/swarm/deploy_composefile.go
func deployStack(ctx context.Context, dockerCLI *command.DockerCli, filePaths []string, options DeployOptions) error {
	info, err := dockerCLI.Client().Info(ctx)
	if err != nil {
		return fmt.Errorf("failed to get docker info: %w", err)
	}

	if !info.Swarm.ControlAvailable {
		return errors.New(`this node is not a swarm manager. Use "docker swarm init" or "docker swarm join" to connect this node to swarm and try again`)
	}

	config, err := getConfig(filePaths, options.WorkingDir, options.Env)
	if err != nil {
		return fmt.Errorf("failed to load compose file: %w", err)
	}

	namespace := convert.NewNamespace(options.ProjectName)

	// Prune orphan services before deploying to avoid name conflicts during rolling updates.
	if options.RemoveOrphans {
		incoming := make(map[string]struct{}, len(config.Services))
		for _, svc := range config.Services {
			incoming[svc.Name] = struct{}{}
		}

		err := pruneServices(ctx, dockerCLI.Client(), namespace, incoming)
		if err != nil {
			return err
		}
	}

	serviceNetworks := getServicesDeclaredNetworks(config.Services)
	networks, externalNetworks := convert.Networks(namespace, config.Networks, serviceNetworks)
	if err := validateExternalNetworks(ctx, dockerCLI.Client(), externalNetworks); err != nil {
		return err
	}

	if err := createNetworks(ctx, dockerCLI.Client(), namespace, networks); err != nil {
		return err
	}

	secrets, err := convert.Secrets(namespace, config.Secrets)
	if err != nil {
		return err
	}

	if err := createSecrets(ctx, dockerCLI.Client(), secrets); err != nil {
		return err
	}

	configs, err := convert.Configs(namespace, config.Configs)
	if err != nil {
		return err
	}

	if err := createConfigs(ctx, dockerCLI.Client(), configs); err != nil {
		return err
	}

	services, err := convert.Services(ctx, namespace, config, dockerCLI.Client())
	if err != nil {
		return err
	}

	registries := normalizeRegistryServerAddresses(options.Registries)

	return deployServices(
		ctx,
		dockerCLI.Client(),
		registries,
		services,
		namespace,
		options.PullImage,
		options.ForceRecreate,
	)
}

func getStackFilter(namespace string) filters.Args {
	f := filters.NewArgs()
	f.Add("label", convert.LabelNamespace+"="+namespace)

	return f
}

func getStackServices(ctx context.Context, apiClient client.APIClient, namespace string) ([]swarm.Service, error) {
	return apiClient.ServiceList(ctx, swarm.ServiceListOptions{Filters: getStackFilter(namespace)})
}

func getStackNetworks(ctx context.Context, apiClient client.APIClient, namespace string) ([]network.Summary, error) {
	return apiClient.NetworkList(ctx, network.ListOptions{Filters: getStackFilter(namespace)})
}

func getStackSecrets(ctx context.Context, apiClient client.APIClient, namespace string) ([]swarm.Secret, error) {
	return apiClient.SecretList(ctx, swarm.SecretListOptions{Filters: getStackFilter(namespace)})
}

func getStackConfigs(ctx context.Context, apiClient client.APIClient, namespace string) ([]swarm.Config, error) {
	return apiClient.ConfigList(ctx, swarm.ConfigListOptions{Filters: getStackFilter(namespace)})
}

func getStackTasks(ctx context.Context, apiClient client.APIClient, namespace string) ([]swarm.Task, error) {
	return apiClient.TaskList(ctx, swarm.TaskListOptions{Filters: getStackFilter(namespace)})
}

func getServicesDeclaredNetworks(services []composetypes.ServiceConfig) map[string]struct{} {
	serviceNetworks := make(map[string]struct{})

	for _, svc := range services {
		if len(svc.Networks) == 0 {
			serviceNetworks["default"] = struct{}{}
			continue
		}
		for nw := range svc.Networks {
			serviceNetworks[nw] = struct{}{}
		}
	}

	return serviceNetworks
}

func validateExternalNetworks(ctx context.Context, apiClient client.NetworkAPIClient, externalNetworks []string) error {
	for _, name := range externalNetworks {
		if !container.NetworkMode(name).IsUserDefined() {
			// Networks that are not user defined always exist on all nodes as
			// local-scoped networks, so there's no need to inspect them.
			continue
		}

		nw, err := apiClient.NetworkInspect(ctx, name, network.InspectOptions{})
		switch {
		case errdefs.IsNotFound(err):
			return fmt.Errorf("network %q is declared as external, but could not be found. You need to create a swarm-scoped network before the stack is deployed", name)
		case err != nil:
			return err
		case nw.Scope != "swarm":
			return fmt.Errorf("network %q is declared as external, but it is not in the right scope: %q instead of \"swarm\"", name, nw.Scope)
		}
	}

	return nil
}

func createNetworks(
	ctx context.Context,
	apiClient client.APIClient,
	namespace convert.Namespace,
	networks map[string]network.CreateOptions,
) error {
	existingNetworks, err := getStackNetworks(ctx, apiClient, namespace.Name())
	if err != nil {
		return err
	}

	existingNetworkMap := make(map[string]network.Summary, len(existingNetworks))
	for _, nw := range existingNetworks {
		existingNetworkMap[nw.Name] = nw
	}

	for name, createOpts := range networks {
		if _, exists := existingNetworkMap[name]; exists {
			continue
		}

		if createOpts.Driver == "" {
			createOpts.Driver = "overlay"
		}

		log.Info().Str("network", name).Msg("creating network")

		if _, err := apiClient.NetworkCreate(ctx, name, createOpts); err != nil {
			return fmt.Errorf("failed to create network %s: %w", name, err)
		}
	}

	return nil
}

func createSecrets(ctx context.Context, apiClient client.APIClient, secrets []swarm.SecretSpec) error {
	for _, secretSpec := range secrets {
		existing, _, err := apiClient.SecretInspectWithRaw(ctx, secretSpec.Name)

		switch {
		case err == nil:
			if err := apiClient.SecretUpdate(ctx, existing.ID, existing.Version, secretSpec); err != nil {
				return fmt.Errorf("failed to update secret %s: %w", secretSpec.Name, err)
			}
		case errdefs.IsNotFound(err):
			log.Info().Str("secret", secretSpec.Name).Msg("creating secret")

			if _, err := apiClient.SecretCreate(ctx, secretSpec); err != nil {
				return fmt.Errorf("failed to create secret %s: %w", secretSpec.Name, err)
			}
		default:
			return err
		}
	}

	return nil
}

func createConfigs(ctx context.Context, apiClient client.APIClient, configs []swarm.ConfigSpec) error {
	for _, configSpec := range configs {
		existing, _, err := apiClient.ConfigInspectWithRaw(ctx, configSpec.Name)

		switch {
		case err == nil:
			if err := apiClient.ConfigUpdate(ctx, existing.ID, existing.Version, configSpec); err != nil {
				return fmt.Errorf("failed to update config %s: %w", configSpec.Name, err)
			}
		case errdefs.IsNotFound(err):
			log.Info().Str("config", configSpec.Name).Msg("creating config")

			if _, err := apiClient.ConfigCreate(ctx, configSpec); err != nil {
				return fmt.Errorf("failed to create config %s: %w", configSpec.Name, err)
			}
		default:
			return err
		}
	}

	return nil
}

// normalizeRegistryServerAddresses returns a copy of registries with each ServerAddress
// rewritten so it matches the domain encodeRegistryAuth resolves for docker.io images
// (dockerregistry.IndexServer).
func normalizeRegistryServerAddresses(registries []configtypes.AuthConfig) []configtypes.AuthConfig {
	normalized := make([]configtypes.AuthConfig, len(registries))

	for i, r := range registries {
		if r.ServerAddress == "" || r.ServerAddress == dockerregistry.DefaultNamespace {
			r.ServerAddress = dockerregistry.IndexServer
		}

		normalized[i] = r
	}

	return normalized
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
		domain = dockerregistry.IndexServer
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

func deployServices(
	ctx context.Context,
	apiClient client.APIClient,
	registries []configtypes.AuthConfig,
	services map[string]swarm.ServiceSpec,
	namespace convert.Namespace,
	pullImage bool,
	forceRecreate bool,
) error {
	existingServices, err := getStackServices(ctx, apiClient, namespace.Name())
	if err != nil {
		return err
	}

	existingServiceMap := make(map[string]swarm.Service, len(existingServices))
	for _, svc := range existingServices {
		existingServiceMap[svc.Spec.Name] = svc
	}

	for internalName, serviceSpec := range services {
		name := namespace.Scope(internalName)
		image := serviceSpec.TaskTemplate.ContainerSpec.Image

		encodedAuth, err := encodeRegistryAuth(image, registries)
		if err != nil {
			return fmt.Errorf("failed to encode registry auth for image %s: %w", image, err)
		}

		if existing, exists := existingServiceMap[name]; exists {
			log.Info().Str("service", name).Str("id", existing.ID).Msg("updating service")

			updateOpts := swarm.ServiceUpdateOptions{EncodedRegistryAuth: encodedAuth}

			if pullImage {
				// pullImage=true → ResolveImageAlways: always query the registry during
				// updates so redeploys can repull images even when the tag is unchanged.
				updateOpts.QueryRegistry = true
			} else {
				// pullImage=false → ResolveImageNever: always reuse the existing digest.
				if image == existing.Spec.Labels[convert.LabelImage] {
					serviceSpec.TaskTemplate.ContainerSpec.Image = existing.Spec.TaskTemplate.ContainerSpec.Image
				}
			}

			if forceRecreate {
				serviceSpec.TaskTemplate.ForceUpdate = existing.Spec.TaskTemplate.ForceUpdate + 1
			} else {
				// Preserve ForceUpdate so that tasks are not re-deployed if nothing changed.
				serviceSpec.TaskTemplate.ForceUpdate = existing.Spec.TaskTemplate.ForceUpdate
			}

			response, err := apiClient.ServiceUpdate(ctx, existing.ID, existing.Version, serviceSpec, updateOpts)
			if err != nil {
				return fmt.Errorf("failed to update service %s: %w", name, err)
			}

			for _, warning := range response.Warnings {
				log.Warn().Str("service", name).Msg(warning)
			}
		} else {
			log.Info().Str("service", name).Msg("creating service")

			createOpts := swarm.ServiceCreateOptions{EncodedRegistryAuth: encodedAuth}

			if pullImage {
				createOpts.QueryRegistry = true
			}

			if _, err := apiClient.ServiceCreate(ctx, serviceSpec, createOpts); err != nil {
				return fmt.Errorf("failed to create service %s: %w", name, err)
			}
		}
	}

	return nil
}

// pruneServices removes services that are present in the existing stack but absent from
// the incoming config. Must be called before deploying the new config to avoid name conflicts.
func pruneServices(
	ctx context.Context,
	apiClient client.APIClient,
	namespace convert.Namespace,
	incoming map[string]struct{},
) error {
	existingServices, err := getStackServices(ctx, apiClient, namespace.Name())
	if err != nil {
		return fmt.Errorf("failed to list services for pruning: %w", err)
	}

	toRemove := make([]swarm.Service, 0, len(existingServices))
	for _, svc := range existingServices {
		if _, exists := incoming[namespace.Descope(svc.Spec.Name)]; !exists {
			toRemove = append(toRemove, svc)
		}
	}

	err = removeServices(ctx, apiClient, toRemove)
	if err != nil {
		return fmt.Errorf("failed to prune orphan services: %w", err)
	}

	return nil
}

func removeServices(ctx context.Context, apiClient client.APIClient, services []swarm.Service) error {
	sort.Slice(services, func(i, j int) bool {
		return services[i].Spec.Name < services[j].Spec.Name
	})

	var errs []error

	for _, svc := range services {
		log.Info().Str("service", svc.Spec.Name).Msg("removing service")

		if err := apiClient.ServiceRemove(ctx, svc.ID); err != nil {
			errs = append(errs, fmt.Errorf("failed to remove service %s: %w", svc.Spec.Name, err))
		}
	}

	return errors.Join(errs...)
}

func removeNetworks(ctx context.Context, apiClient client.APIClient, networks []network.Summary) error {
	var errs []error

	for _, nw := range networks {
		log.Info().Str("network", nw.Name).Msg("removing network")

		if err := apiClient.NetworkRemove(ctx, nw.ID); err != nil {
			errs = append(errs, fmt.Errorf("failed to remove network %s: %w", nw.Name, err))
		}
	}

	return errors.Join(errs...)
}

func removeSecrets(ctx context.Context, apiClient client.APIClient, secrets []swarm.Secret) error {
	var errs []error

	for _, secret := range secrets {
		log.Info().Str("secret", secret.Spec.Name).Msg("removing secret")

		if err := apiClient.SecretRemove(ctx, secret.ID); err != nil {
			errs = append(errs, fmt.Errorf("failed to remove secret %s: %w", secret.Spec.Name, err))
		}
	}

	return errors.Join(errs...)
}

func removeConfigs(ctx context.Context, apiClient client.APIClient, configs []swarm.Config) error {
	var errs []error

	for _, cfg := range configs {
		log.Info().Str("config", cfg.Spec.Name).Msg("removing config")

		if err := apiClient.ConfigRemove(ctx, cfg.ID); err != nil {
			errs = append(errs, fmt.Errorf("failed to remove config %s: %w", cfg.Spec.Name, err))
		}
	}

	return errors.Join(errs...)
}

// taskStateOrdinal mirrors docker/cli's unexported numberedStates map (cli/command/stack/swarm/remove.go).
// The Docker SDK does not export terminal-state checking utilities, so we duplicate it here.
var taskStateOrdinal = map[swarm.TaskState]int{
	swarm.TaskStateNew:       1,
	swarm.TaskStateAllocated: 2,
	swarm.TaskStatePending:   3,
	swarm.TaskStateAssigned:  4,
	swarm.TaskStateAccepted:  5,
	swarm.TaskStatePreparing: 6,
	swarm.TaskStateReady:     7,
	swarm.TaskStateStarting:  8,
	swarm.TaskStateRunning:   9,
	swarm.TaskStateComplete:  10,
	swarm.TaskStateShutdown:  11,
	swarm.TaskStateFailed:    12,
	swarm.TaskStateRejected:  13,
}

func isTerminalState(state swarm.TaskState) bool {
	return taskStateOrdinal[state] > taskStateOrdinal[swarm.TaskStateRunning]
}

func getConfig(filePaths []string, workingDir string, env []string) (*composetypes.Config, error) {
	// Load and parse the compose file(s).
	configDetails, err := getConfigDetails(filePaths, workingDir, env)
	if err != nil {
		return nil, fmt.Errorf("failed to load compose file: %w", err)
	}

	// Collect raw config dicts for unsupported/deprecated property checks.
	dicts := make([]map[string]any, 0, len(configDetails.ConfigFiles))
	for _, cf := range configDetails.ConfigFiles {
		dicts = append(dicts, cf.Config)
	}

	config, err := composeloader.Load(configDetails)
	if err != nil {
		if fpe, ok := errors.AsType[*composeloader.ForbiddenPropertiesError](err); ok {
			return nil, fmt.Errorf("compose file contains unsupported options: %v", fpe.Properties)
		}

		return nil, fmt.Errorf("failed to parse compose file: %w", err)
	}

	if unsupported := composeloader.GetUnsupportedProperties(dicts...); len(unsupported) > 0 {
		log.Warn().Strs("properties", unsupported).Msg("ignoring unsupported compose properties")
	}

	if deprecated := composeloader.GetDeprecatedProperties(dicts...); len(deprecated) > 0 {
		log.Warn().Interface("properties", deprecated).Msg("ignoring deprecated compose properties")
	}

	for _, svc := range config.Services {
		if svc.Image == "" {
			return nil, fmt.Errorf("invalid image reference for service %s: no image specified", svc.Name)
		}
		if _, err := reference.ParseAnyReference(svc.Image); err != nil {
			return nil, fmt.Errorf("invalid image reference for service %s: %w", svc.Name, err)
		}
	}

	return config, nil
}

func getConfigDetails(filePaths []string, workingDir string, env []string) (composetypes.ConfigDetails, error) {
	var details composetypes.ConfigDetails

	if len(filePaths) == 0 {
		return details, errors.New("at least one compose file must be specified")
	}

	details.WorkingDir = filepath.Dir(filePaths[0])

	details.ConfigFiles = make([]composetypes.ConfigFile, 0, len(filePaths))
	for _, fp := range filePaths {
		bytes, err := os.ReadFile(fp)
		if err != nil {
			return details, err
		}

		config, err := composeloader.ParseYAML(bytes)
		if err != nil {
			return details, err
		}

		// env_file paths are authored relative to the compose file's directory, but are resolved
		// under the git repo / project root (workingDir) so they can reference sibling directories
		// within the root (e.g. an edge-config directory) while staying clamped to it. composeDirRel
		// is the compose file's directory relative to that root. When no root is provided, fall back
		// to resolving against the compose file's own directory.
		composeDir := filepath.Dir(fp)
		root := workingDir
		var composeDirRel string
		if root == "" {
			root = composeDir
		} else if rel, err := filepath.Rel(root, composeDir); err == nil {
			composeDirRel = rel
		} else {
			root = composeDir
		}

		resolveRelativePaths(config, root, composeDirRel)

		details.ConfigFiles = append(details.ConfigFiles, composetypes.ConfigFile{
			Filename: fp,
			Config:   config,
		})
	}

	// Take the first file version (2 files can't have different version)
	details.Version = schema.Version(details.ConfigFiles[0].Config)

	details.Environment = make(map[string]string)

	addEnvVarFn := func(e string) {
		k, v, _ := strings.Cut(e, "=")
		if k != "" {
			details.Environment[k] = v
		}
	}

	for _, e := range libstack.PortainerEnvVars() {
		addEnvVarFn(e)
	}

	for _, e := range env {
		addEnvVarFn(e)
	}

	return details, nil
}

// resolveRelativePaths rewrites the on-disk paths a compose file references (service env_file
// entries and secret/config file entries) to absolute paths clamped under root, so that a relative
// "../" can reach a sibling directory within the project root but can never escape above it.
func resolveRelativePaths(rawConfig map[string]any, root, composeDirRel string) {
	resolveEnvFilePaths(rawConfig, root, composeDirRel)
	resolveFileObjectPaths(rawConfig, "secrets", root, composeDirRel)
	resolveFileObjectPaths(rawConfig, "configs", root, composeDirRel)
}

// resolveEnvFilePaths rewrites each service's relative env_file to an absolute path. Paths are
// authored relative to the compose file's directory (composeDirRel, relative to root) and are
// resolved under root via filesystem.JoinPaths. Because JoinPaths keeps the result clamped to root,
// a "../" can traverse into a sibling directory within the root (e.g. an edge-config directory) but
// can never escape above it.
func resolveEnvFilePaths(rawConfig map[string]any, root, composeDirRel string) {
	services, ok := rawConfig["services"].(map[string]any)
	if !ok {
		return
	}
	for _, svcAny := range services {
		svc, ok := svcAny.(map[string]any)
		if !ok {
			continue
		}
		envFileAny, ok := svc["env_file"]
		if !ok {
			continue
		}
		switch ef := envFileAny.(type) {
		case string:
			if !filepath.IsAbs(ef) {
				svc["env_file"] = filesystem.JoinPaths(root, composeDirRel, ef)
			}
		case []any:
			for i, v := range ef {
				if s, ok := v.(string); ok && !filepath.IsAbs(s) {
					ef[i] = filesystem.JoinPaths(root, composeDirRel, s)
				}
			}
		}
	}
}

// resolveFileObjectPaths rewrites relative file entries under a top-level section (secrets or
// configs) to absolute paths clamped under root via filesystem.JoinPaths, using the same semantics
// as resolveEnvFilePaths. External and driver-based secrets/configs carry no file key and are
// skipped. Unlike env_file, the file field is always a single string.
func resolveFileObjectPaths(rawConfig map[string]any, section, root, composeDirRel string) {
	objs, ok := rawConfig[section].(map[string]any)
	if !ok {
		return
	}
	for _, objAny := range objs {
		obj, ok := objAny.(map[string]any)
		if !ok {
			continue
		}
		fileAny, ok := obj["file"]
		if !ok {
			continue
		}
		if s, ok := fileAny.(string); ok && !filepath.IsAbs(s) {
			obj["file"] = filesystem.JoinPaths(root, composeDirRel, s)
		}
	}
}

// WaitForStatus blocks until all services in the stack reach the requested status,
// or the context is cancelled. It polls the Docker API every second.
func (d *SwarmDeployer) WaitForStatus(
	ctx context.Context,
	projectName string,
	options Options,
	status libstack.Status,
) libstack.WaitResult {
	waitResult := libstack.WaitResult{Status: status}

	// WithCli replaces the context with Background internally, so we capture the
	// caller's context here to preserve cancellation.
	callerCtx := ctx

	err := libstack.WithCli(
		ctx,
		cliOptions(options.Host, options.Registries),
		func(_ context.Context, dockerCLI *command.DockerCli) error {
			apiClient := dockerCLI.Client()

			for {
				if callerCtx.Err() != nil {
					waitResult.ErrorMsg = "failed to wait for status: " + callerCtx.Err().Error()
					return nil
				}

				time.Sleep(time.Second)

				services, err := getStackServices(callerCtx, apiClient, projectName)
				if err != nil {
					log.Warn().Str("project_name", projectName).Err(err).Msg("failed to list stack services")
					continue
				}

				if len(services) == 0 && status == libstack.StatusRemoved {
					return nil
				}

				var serviceStatuses []libstack.Status

				for _, svc := range services {
					svcStatus, errorMessage, err := getServiceStatus(callerCtx, apiClient, svc)
					if err != nil {
						log.Warn().
							Str("project_name", projectName).
							Str("service_name", svc.Spec.Name).
							Err(err).
							Msg("failed to get service status")
						continue
					}

					if errorMessage != "" {
						// An error message means a service failed, so the result must reflect that.
						waitResult.Status = libstack.StatusError
						waitResult.ErrorMsg = errorMessage
						return nil
					}

					serviceStatuses = append(serviceStatuses, svcStatus)
				}

				aggregate := aggregateStatus(serviceStatuses)

				if aggregate == status {
					return nil
				}

				// A stack made up entirely of job services never reaches "running":
				// mirror the compose deployer and treat "completed" as success.
				if status == libstack.StatusRunning && aggregate == libstack.StatusCompleted {
					waitResult.Status = libstack.StatusCompleted

					return nil
				}

				log.Debug().
					Str("project_name", projectName).
					Str("required_status", string(status)).
					Str("status", string(aggregate)).
					Msg("waiting for status")
			}
		})

	if err != nil && waitResult.ErrorMsg == "" {
		waitResult.Status = libstack.StatusError
		waitResult.ErrorMsg = err.Error()
	}

	return waitResult
}

func aggregateStatus(statuses []libstack.Status) libstack.Status {
	if len(statuses) == 0 {
		return libstack.StatusRemoved
	}

	statusCounts := make(map[libstack.Status]int)
	for _, status := range statuses {
		statusCounts[status]++
	}

	log.Debug().Interface("statusCounts", statusCounts).Msg("check_status")

	return libstack.AggregateStatusCounts(statusCounts, len(statuses))
}

func getServiceStatus(
	ctx context.Context,
	apiClient client.APIClient,
	svc swarm.Service,
) (libstack.Status, string, error) {
	tasks, err := apiClient.TaskList(ctx, swarm.TaskListOptions{
		Filters: filters.NewArgs(filters.KeyValuePair{Key: "service", Value: svc.ID}),
	})
	if err != nil {
		return "", "", fmt.Errorf("failed to list tasks for service %s: %w", svc.Spec.Name, err)
	}

	if svc.Spec.Mode.ReplicatedJob != nil || svc.Spec.Mode.GlobalJob != nil {
		status, errorMessage := jobServiceStatus(svc, tasks)

		return status, errorMessage, nil
	}

	expectedRunningTaskCount := 0

	if svc.Spec.Mode.Replicated != nil {
		expectedRunningTaskCount = int(*svc.Spec.Mode.Replicated.Replicas)
	}

	if svc.Spec.Mode.Global != nil {
		nodes, err := apiClient.NodeList(ctx, swarm.NodeListOptions{})
		if err != nil {
			return "", "", fmt.Errorf("failed to list nodes: %w", err)
		}

		expectedRunningTaskCount = len(nodes)
	}

	if expectedRunningTaskCount != 0 {
		runningTaskCount := 0

		for _, task := range tasks {
			if task.Status.State == swarm.TaskStateRunning {
				runningTaskCount++
			}
		}

		if runningTaskCount == expectedRunningTaskCount {
			return libstack.StatusRunning, "", nil
		}
	}

	for _, task := range tasks {
		switch task.Status.State {
		case swarm.TaskStateRunning:
			return libstack.StatusRunning, "", nil
		case swarm.TaskStatePending, swarm.TaskStateStarting:
			return libstack.StatusStarting, "", nil
		case swarm.TaskStateRemove:
			return libstack.StatusRemoving, "", nil
		case swarm.TaskStateFailed, swarm.TaskStateRejected:
			// Rejected means the task could never start (e.g. missing image, no disk space).
			return libstack.StatusError, task.Status.Err, nil
		default:
			return libstack.StatusUnknown, "", nil
		}
	}

	return libstack.StatusUnknown, "", nil
}

// jobServiceStatus derives the status of a replicated-job or global-job service
// from its tasks. Only tasks belonging to the current job iteration are
// considered: on re-deployment swarm increments JobStatus.JobIteration and
// completed tasks from previous iterations linger in the task history.
func jobServiceStatus(svc swarm.Service, tasks []swarm.Task) (libstack.Status, string) {
	if svc.JobStatus != nil {
		iteration := svc.JobStatus.JobIteration.Index

		currentTasks := make([]swarm.Task, 0, len(tasks))
		for _, task := range tasks {
			if task.JobIteration != nil && task.JobIteration.Index == iteration {
				currentTasks = append(currentTasks, task)
			}
		}

		tasks = currentTasks
	}

	runningCount, completedCount := 0, 0

	for _, task := range tasks {
		switch task.Status.State {
		case swarm.TaskStateFailed, swarm.TaskStateRejected:
			// Consistent with regular services: any failed task reports an error.
			return libstack.StatusError, task.Status.Err
		case swarm.TaskStateRemove:
			return libstack.StatusRemoving, ""
		case swarm.TaskStateRunning:
			runningCount++
		case swarm.TaskStateComplete:
			completedCount++
		}
	}

	if completedCount >= expectedJobCompletions(svc, len(tasks)) {
		return libstack.StatusCompleted, ""
	}

	if runningCount > 0 {
		return libstack.StatusRunning, ""
	}

	return libstack.StatusStarting, ""
}

// expectedJobCompletions returns the number of completed tasks required for a
// job service to be considered done.
func expectedJobCompletions(svc swarm.Service, currentTaskCount int) int {
	if replicatedJob := svc.Spec.Mode.ReplicatedJob; replicatedJob != nil {
		if replicatedJob.TotalCompletions != nil {
			return int(*replicatedJob.TotalCompletions)
		}

		// Per the Docker API, MaxConcurrent is used when TotalCompletions is unset.
		if replicatedJob.MaxConcurrent != nil {
			return int(*replicatedJob.MaxConcurrent)
		}

		return 1
	}

	// Global job: swarm creates all tasks for the current iteration up front,
	// one per eligible node, so the current task count is the target. The
	// eligible node count cannot be derived from NodeList because placement
	// constraints restrict which nodes get a task.
	return max(currentTaskCount, 1)
}

// waitOnTasks polls until all tasks belonging to the namespace reach a terminal state.
func waitOnTasks(ctx context.Context, apiClient client.APIClient, namespace string) error {
	for {
		if ctx.Err() != nil {
			return ctx.Err()
		}

		tasks, err := getStackTasks(ctx, apiClient, namespace)
		if err != nil {
			return fmt.Errorf("failed to get tasks: %w", err)
		}

		if len(tasks) == 0 {
			return nil
		}

		allTerminal := true

		for _, task := range tasks {
			if !isTerminalState(task.Status.State) {
				allTerminal = false

				break
			}
		}

		if allTerminal {
			return nil
		}

		time.Sleep(time.Second)
	}
}
