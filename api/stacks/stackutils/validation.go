package stackutils

import (
	"strings"

	portainer "github.com/portainer/portainer/api"

	"github.com/docker/cli/cli/compose/loader"
	"github.com/docker/cli/cli/compose/types"
	"github.com/pkg/errors"
)

func loadComposeConfig(stackFileContent []byte) (*types.Config, error) {
	composeConfigYAML, err := loader.ParseYAML(stackFileContent)
	if err != nil {
		return nil, err
	}

	composeConfigFile := types.ConfigFile{
		Config: composeConfigYAML,
	}

	composeConfigDetails := types.ConfigDetails{
		ConfigFiles: []types.ConfigFile{composeConfigFile},
		Environment: map[string]string{},
	}

	return loader.Load(composeConfigDetails, func(options *loader.Options) {
		options.SkipValidation = true
		options.SkipInterpolation = true
	})
}

func IsValidStackFileAdapter(securitySettings *portainer.EndpointSecuritySettings) func(*types.Config) error {
	return func(composeConfig *types.Config) error {
		return IsValidStackFile(composeConfig, securitySettings)
	}
}

func IsValidStackFile(composeConfig *types.Config, securitySettings *portainer.EndpointSecuritySettings) error {
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

func ValidateStackFiles(stack *portainer.Stack, isValidFn func(content *types.Config) error, fileService portainer.FileService) error {
	for _, file := range GetStackFilePaths(stack, false) {
		stackContent, err := fileService.GetFileContent(stack.ProjectPath, file)
		if err != nil {
			return errors.Wrap(err, "failed to get stack file content")
		}

		composeConfig, err := loadComposeConfig(stackContent)
		if err != nil {
			return err
		}

		err = isValidFn(composeConfig)
		if err != nil {
			return errors.Wrap(err, "stack config file is invalid")
		}
	}

	return nil
}

func IsValidBuildContext(composeConfig *types.Config) error {
	for key := range composeConfig.Services {
		service := composeConfig.Services[key]

		if strings.HasPrefix(service.Build.Context, "/") || strings.Contains(service.Build.Context, "..") {
			return errors.New("invalid build context")
		}

		driveLetter, _, ok := strings.Cut(service.Build.Context, ":")
		driveLetter = strings.ToUpper(driveLetter)

		if ok && len(driveLetter) == 1 && driveLetter >= "A" && driveLetter <= "Z" {
			return errors.New("invalid build context")
		}
	}

	return nil
}
