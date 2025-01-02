package stackutils

import (
	"github.com/docker/cli/cli/compose/loader"
	"github.com/docker/cli/cli/compose/types"
	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
)

func IsValidStackFile(stackFileContent []byte, securitySettings *portainer.EndpointSecuritySettings) error {
	composeConfigYAML, err := loader.ParseYAML(stackFileContent)
	if err != nil {
		return err
	}

	composeConfigFile := types.ConfigFile{
		Config: composeConfigYAML,
	}

	composeConfigDetails := types.ConfigDetails{
		ConfigFiles: []types.ConfigFile{composeConfigFile},
		Environment: map[string]string{},
	}

	composeConfig, err := loader.Load(composeConfigDetails, func(options *loader.Options) {
		options.SkipValidation = true
		options.SkipInterpolation = true
	})
	if err != nil {
		return err
	}

	for key := range composeConfig.Services {
		service := composeConfig.Services[key]
		if !securitySettings.AllowBindMountsForRegularUsers {
			for _, volume := range service.Volumes {
				if volume.Type == "bind" {
					return errors.New("bind-mount disabled for non administrator users")
				}
			}
		}

		if !securitySettings.AllowPrivilegedModeForRegularUsers && service.Privileged {
			return errors.New("privileged mode disabled for non administrator users")
		}

		if !securitySettings.AllowHostNamespaceForRegularUsers && service.Pid == "host" {
			return errors.New("pid host disabled for non administrator users")
		}

		if !securitySettings.AllowDeviceMappingForRegularUsers && len(service.Devices) > 0 {
			return errors.New("device mapping disabled for non administrator users")
		}

		if !securitySettings.AllowSysctlSettingForRegularUsers && len(service.Sysctls) > 0 {
			return errors.New("sysctl setting disabled for non administrator users")
		}

		if !securitySettings.AllowContainerCapabilitiesForRegularUsers && (len(service.CapAdd) > 0 || len(service.CapDrop) > 0) {
			return errors.New("container capabilities disabled for non administrator users")
		}
	}

	return nil
}

func ValidateStackFiles(stack *portainer.Stack, securitySettings *portainer.EndpointSecuritySettings, fileService portainer.FileService) error {
	for _, file := range GetStackFilePaths(stack, false) {
		stackContent, err := fileService.GetFileContent(stack.ProjectPath, file)
		if err != nil {
			return errors.Wrap(err, "failed to get stack file content")
		}

		err = IsValidStackFile(stackContent, securitySettings)
		if err != nil {
			return errors.Wrap(err, "stack config file is invalid")
		}
	}
	return nil
}
