package stackutils

import (
	"context"
	"fmt"
	"path"
	"path/filepath"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"

	composeloader "github.com/compose-spec/compose-go/v2/loader"
	composetypes "github.com/compose-spec/compose-go/v2/types"
	dockerclient "github.com/docker/docker/client"
	"github.com/pkg/errors"
)

type StackFileValidationConfig struct {
	Content          []byte
	SecuritySettings *portainer.EndpointSecuritySettings
	Env              map[string]string
	WorkingDir       string
	ProjectPath      string
	StackName        string
	DockerClient     *dockerclient.Client
}

func IsValidStackFile(config StackFileValidationConfig) error {
	composeConfigDetails := composetypes.ConfigDetails{
		ConfigFiles: []composetypes.ConfigFile{{Content: config.Content}},
		Environment: config.Env,
		WorkingDir:  config.WorkingDir,
	}

	setProjectName := func(o *composeloader.Options) {
		o.SetProjectName(config.StackName, config.StackName != "")
	}

	restrictResourceLoading := func(o *composeloader.Options) {
		if config.SecuritySettings.AllowBindMountsForRegularUsers {
			return
		}

		// `include` has its own env_file resolution that reads files directly
		// from disk, bypassing ResourceLoaders entirely, so it can't be safely
		// contained by restrictedResourceLoader below. Disable it outright.
		o.SkipInclude = true

		o.ResourceLoaders = append(o.ResourceLoaders, restrictedResourceLoader{
			workingDir:  config.WorkingDir,
			projectPath: config.ProjectPath,
		})
	}

	loadOptions := []func(*composeloader.Options){composeloader.WithSkipValidation, setProjectName, restrictResourceLoading}

	if !config.SecuritySettings.AllowBindMountsForRegularUsers {
		dict, err := composeloader.LoadModelWithContext(context.Background(), composeConfigDetails, loadOptions...)
		if err != nil {
			return err
		}

		if err := checkEnvAndLabelFileSources(dict, config.ProjectPath); err != nil {
			return err
		}
	}

	composeConfig, err := composeloader.LoadWithContext(context.Background(), composeConfigDetails, loadOptions...)
	if err != nil {
		return err
	}

	if !config.SecuritySettings.AllowBindMountsForRegularUsers {
		for volumeKey, volumeConfig := range composeConfig.Volumes {
			if docker.IsBindMount(docker.MountDescriptor{Driver: volumeConfig.Driver, DriverOpts: volumeConfig.DriverOpts}) {
				return fmt.Errorf("volume %q: bind-mount disabled for non administrator users", volumeKey)
			}

			if config.DockerClient == nil {
				return fmt.Errorf("volume %q: unable to verify bind-mount status without a Docker client", volumeKey)
			}

			isBind, err := docker.InspectVolumeIsBindMount(context.Background(), config.DockerClient, volumeConfig.Name)
			if err != nil {
				return err
			}

			if isBind {
				return fmt.Errorf("volume %q: bind-mount disabled for non administrator users", volumeKey)
			}
		}

		for name, configObj := range composeConfig.Configs {
			if err := checkFileObjectSource("config", name, configObj.File, config.ProjectPath); err != nil {
				return err
			}
		}

		for name, secret := range composeConfig.Secrets {
			if err := checkFileObjectSource("secret", name, secret.File, config.ProjectPath); err != nil {
				return err
			}
		}
	}

	for _, service := range composeConfig.Services {
		if !config.SecuritySettings.AllowBindMountsForRegularUsers {
			for _, volume := range service.Volumes {
				if docker.IsBindMount(docker.MountDescriptor{Type: volume.Type}) {
					return errors.New("bind-mount disabled for non administrator users")
				}
			}

			if service.Build != nil {
				if err := checkBuildContextSource(service.Name, service.Build.Context, config.ProjectPath); err != nil {
					return err
				}

				if err := checkDockerfileSource(service.Name, service.Build.Context, service.Build.Dockerfile, config.ProjectPath); err != nil {
					return err
				}

				for name, buildContext := range service.Build.AdditionalContexts {
					if err := checkBuildContextSource(service.Name+"."+name, buildContext, config.ProjectPath); err != nil {
						return err
					}
				}

				for _, sshKey := range service.Build.SSH {
					if err := checkFileObjectSource("build ssh", service.Name+"."+sshKey.ID, sshKey.Path, config.ProjectPath); err != nil {
						return err
					}
				}
			}

			if service.Develop != nil {
				for _, trigger := range service.Develop.Watch {
					if err := checkFileObjectSource("develop watch", service.Name, trigger.Path, config.ProjectPath); err != nil {
						return err
					}
				}
			}
		}

		if !config.SecuritySettings.AllowPrivilegedModeForRegularUsers && service.Privileged {
			return errors.New("privileged mode disabled for non administrator users")
		}

		if !config.SecuritySettings.AllowHostNamespaceForRegularUsers && service.Pid == "host" {
			return errors.New("pid host disabled for non administrator users")
		}

		if !config.SecuritySettings.AllowDeviceMappingForRegularUsers && len(service.Devices) > 0 {
			return errors.New("device mapping disabled for non administrator users")
		}

		if !config.SecuritySettings.AllowSysctlSettingForRegularUsers && len(service.Sysctls) > 0 {
			return errors.New("sysctl setting disabled for non administrator users")
		}

		if !config.SecuritySettings.AllowSecurityOptForRegularUsers && len(service.SecurityOpt) > 0 {
			return errors.New("security-opt setting disabled for non administrator users")
		}

		if !config.SecuritySettings.AllowContainerCapabilitiesForRegularUsers && (len(service.CapAdd) > 0 || len(service.CapDrop) > 0) {
			return errors.New("container capabilities disabled for non administrator users")
		}
	}

	return nil
}

func checkBuildContextSource(name, buildContext, projectPath string) error {
	if !filepath.IsAbs(buildContext) {
		return nil
	}

	return checkFileObjectSource("build context", name, buildContext, projectPath)
}

func checkDockerfileSource(name, buildContext, dockerfile, projectPath string) error {
	if dockerfile == "" {
		return nil
	}

	if !filepath.IsAbs(dockerfile) {
		if !filepath.IsAbs(buildContext) {
			return nil
		}

		// filesystem.JoinPaths would jail the result inside buildContext, hiding a real
		// escape instead of catching it: Docker resolves a relative dockerfile the same
		// unjailed way at build time, so this join must mirror that to detect it.
		dockerfile = filepath.Join(buildContext, dockerfile) //nolint:forbidigo
	}

	return checkFileObjectSource("build dockerfile", name, dockerfile, projectPath)
}

func checkEnvAndLabelFileSources(dict map[string]any, projectPath string) error {
	services, _ := dict["services"].(map[string]any)

	for name, s := range services {
		service, ok := s.(map[string]any)
		if !ok {
			continue
		}

		for _, entry := range toAnySlice(service["env_file"]) {
			entryMap, ok := entry.(map[string]any)
			if !ok {
				continue
			}

			path, _ := entryMap["path"].(string)
			if err := checkFileObjectSource("env_file", name, path, projectPath); err != nil {
				return err
			}
		}

		for _, entry := range toAnySlice(service["label_file"]) {
			path, _ := entry.(string)
			if err := checkFileObjectSource("label_file", name, path, projectPath); err != nil {
				return err
			}
		}
	}

	return nil
}

func toAnySlice(v any) []any {
	s, _ := v.([]any)
	return s
}

// restrictedResourceLoader intercepts compose-go's resolution of `extends.file`
// references (`include` is disabled outright, see SkipInclude above). The
// extended file is read and merged into the compose model while the file is
// being parsed, before any of the checks above ever run, so it is blocked
// here instead: at the point compose-go resolves the path to a local file,
// ahead of reading its content.
type restrictedResourceLoader struct {
	workingDir  string
	projectPath string
}

func (restrictedResourceLoader) Accept(_ string) bool {
	return true
}

func (r restrictedResourceLoader) Load(_ context.Context, p string) (string, error) {
	abs := p
	if !filepath.IsAbs(abs) {
		abs = filesystem.JoinPaths(r.workingDir, abs)
	}

	if err := checkFileObjectSource("include/extends", p, abs, r.projectPath); err != nil {
		return "", err
	}

	return abs, nil
}

func (r restrictedResourceLoader) Dir(originalPath string) string {
	abs := originalPath
	if !filepath.IsAbs(abs) {
		abs = filesystem.JoinPaths(r.workingDir, abs)
	}

	abs = filepath.Dir(abs)

	rel, err := filepath.Rel(r.workingDir, abs)
	if err != nil {
		return abs
	}

	return rel
}

func checkFileObjectSource(kind, name, file, projectPath string) error {
	if file == "" {
		return nil
	}

	if projectPath == "" {
		return fmt.Errorf("%s %q: reading a file from the host is disabled for non administrator users", kind, name)
	}

	rel, err := filepath.Rel(filepath.Clean(projectPath), filepath.Clean(file))
	if err != nil || rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return fmt.Errorf("%s %q: reading a file from the host is disabled for non administrator users", kind, name)
	}

	return nil
}

// ValidateComposeURLs parses each stack file and checks that every external URL
// (build contexts and image registry hostnames) is permitted by the active SSRF
// policy. It is a no-op when SSRF protection is disabled.
func ValidateComposeURLs(ctx context.Context, stack *portainer.Stack, fileService portainer.FileService) error {
	if !ssrf.IsEnabled() {
		return nil
	}

	env, err := BuildEnvMap(stack)
	if err != nil {
		return errors.Wrap(err, "failed to build stack environment variables")
	}

	workingDir := filesystem.JoinPaths(stack.ProjectPath, path.Dir(stack.EntryPoint))

	for _, file := range GetStackFilePaths(stack, false) {
		stackContent, err := fileService.GetFileContent(stack.ProjectPath, file)
		if err != nil {
			return errors.Wrap(err, "failed to get stack file content")
		}

		if err := checkComposeFileURLs(ctx, stackContent, env, workingDir); err != nil {
			return errors.Wrap(err, "stack file contains a URL blocked by the SSRF policy")
		}
	}

	return nil
}

// ValidateEdgeStackComposeContent checks that every external URL in an edge
// stack's Compose file is permitted by the active SSRF policy. It is a no-op
// when SSRF protection is disabled or the deployment type is not compose.
func ValidateEdgeStackComposeContent(ctx context.Context, deploymentType portainer.EdgeStackDeploymentType, content []byte) error {
	if !ssrf.IsEnabled() || deploymentType != portainer.EdgeStackDeploymentCompose {
		return nil
	}

	if err := checkComposeFileURLs(ctx, content, nil, ""); err != nil {
		return errors.Wrap(err, "stack file contains a URL blocked by the SSRF policy")
	}

	return nil
}

func checkComposeFileURLs(ctx context.Context, content []byte, env map[string]string, workingDir string) error {
	composeConfigDetails := composetypes.ConfigDetails{
		ConfigFiles: []composetypes.ConfigFile{{Content: content}},
		Environment: env,
		WorkingDir:  workingDir,
	}

	composeConfig, err := composeloader.LoadWithContext(ctx, composeConfigDetails, composeloader.WithSkipValidation)
	if err != nil {
		return err
	}

	for _, service := range composeConfig.Services {
		if service.Build != nil {
			buildCtx := service.Build.Context
			if strings.HasPrefix(buildCtx, "http://") || strings.HasPrefix(buildCtx, "https://") {
				if err := ssrf.CheckURL(ctx, buildCtx); err != nil {
					return fmt.Errorf("service %q: build context URL blocked: %w", service.Name, err)
				}
			}
		}

		if service.Image != "" {
			if registry := extractImageRegistry(service.Image); registry != "" {
				if err := ssrf.CheckURL(ctx, "https://"+registry); err != nil {
					return fmt.Errorf("service %q: image registry %q blocked: %w", service.Name, registry, err)
				}
			}
		}
	}

	return nil
}

// extractImageRegistry returns the registry hostname from an OCI image reference,
// or an empty string if the image resolves to Docker Hub (no explicit registry).
func extractImageRegistry(imageRef string) string {
	ref, _, _ := strings.Cut(imageRef, "@")

	first, _, hasSlash := strings.Cut(ref, "/")
	if !hasSlash {
		return ""
	}

	if strings.ContainsAny(first, ".:") || first == "localhost" {
		return first
	}

	return ""
}

func ValidateStackFiles(stack *portainer.Stack, securitySettings *portainer.EndpointSecuritySettings, fileService portainer.FileService, dockerClient *dockerclient.Client) error {
	env, err := BuildEnvMap(stack)
	if err != nil {
		return errors.Wrap(err, "failed to build stack environment variables")
	}

	workingDir := filesystem.JoinPaths(stack.ProjectPath, path.Dir(stack.EntryPoint))

	for _, file := range GetStackFilePaths(stack, false) {
		stackContent, err := fileService.GetFileContent(stack.ProjectPath, file)
		if err != nil {
			return errors.Wrap(err, "failed to get stack file content")
		}

		if err := IsValidStackFile(StackFileValidationConfig{
			Content:          stackContent,
			SecuritySettings: securitySettings,
			Env:              env,
			WorkingDir:       workingDir,
			ProjectPath:      stack.ProjectPath,
			StackName:        stack.Name,
			DockerClient:     dockerClient,
		}); err != nil {
			return errors.Wrap(err, "stack config file is invalid")
		}
	}

	return nil
}
