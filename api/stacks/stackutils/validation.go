package stackutils

import (
	"context"
	"path"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/filesystem"

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

		if !config.SecuritySettings.AllowContainerCapabilitiesForRegularUsers && (len(service.CapAdd) > 0 || len(service.CapDrop) > 0) {
			return errors.New("container capabilities disabled for non administrator users")
		}
	}

	return nil
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
