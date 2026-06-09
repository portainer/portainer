package stackutils

import (
	"context"
	"fmt"
	"path"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/pkg/libhttp/ssrf"

	composeloader "github.com/compose-spec/compose-go/v2/loader"
	composetypes "github.com/compose-spec/compose-go/v2/types"
	"github.com/pkg/errors"
)

type StackFileValidationConfig struct {
	Content          []byte
	SecuritySettings *portainer.EndpointSecuritySettings
	Env              map[string]string
	WorkingDir       string
}

func IsValidStackFile(config StackFileValidationConfig) error {
	composeConfigDetails := composetypes.ConfigDetails{
		ConfigFiles: []composetypes.ConfigFile{{Content: config.Content}},
		Environment: config.Env,
		WorkingDir:  config.WorkingDir,
	}

	composeConfig, err := composeloader.LoadWithContext(context.Background(), composeConfigDetails, composeloader.WithSkipValidation)
	if err != nil {
		return err
	}

	for _, service := range composeConfig.Services {
		if !config.SecuritySettings.AllowBindMountsForRegularUsers {
			for _, volume := range service.Volumes {
				if volume.Type == "bind" {
					return errors.New("bind-mount disabled for non administrator users")
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

// ValidateComposeURLs parses each stack file and checks that every external URL
// (build contexts and image registry hostnames) is permitted by the active SSRF
// policy. It is a no-op when SSRF protection is disabled.
func ValidateComposeURLs(ctx context.Context, stack *portainer.Stack, fileService portainer.FileService) error {
	if !ssrf.IsEnabled() {
		return nil
	}

	env := BuildEnvMap(stack)
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

func ValidateStackFiles(stack *portainer.Stack, securitySettings *portainer.EndpointSecuritySettings, fileService portainer.FileService) error {
	env := BuildEnvMap(stack)
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
		}); err != nil {
			return errors.Wrap(err, "stack config file is invalid")
		}
	}

	return nil
}
