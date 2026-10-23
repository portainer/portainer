package docker

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	cerrdefs "github.com/containerd/errdefs"
	"github.com/docker/docker/client"
)

var windowsAbsolutePathPrefix = regexp.MustCompile(`^[A-Za-z]:[\\/]`)

type MountDescriptor struct {
	Type       string
	Driver     string
	DriverOpts map[string]string
}

func IsBindMount(m MountDescriptor) bool {
	if strings.EqualFold(m.Type, "bind") {
		return true
	}

	isLocalDriver := m.Driver == "" || strings.EqualFold(m.Driver, "local")

	for key, value := range m.DriverOpts {
		if strings.EqualFold(key, "type") && strings.EqualFold(value, "bind") {
			return true
		}

		if strings.EqualFold(key, "o") {
			for token := range strings.SplitSeq(value, ",") {
				token = strings.TrimSpace(token)
				if strings.EqualFold(token, "bind") || strings.EqualFold(token, "rbind") {
					return true
				}
			}
		}

		if isLocalDriver && strings.EqualFold(key, "device") && value != "" {
			return true
		}
	}

	return false
}

func IsBindPath(bind string) bool {
	return strings.HasPrefix(bind, "/") || windowsAbsolutePathPrefix.MatchString(bind)
}

func InspectVolumeIsBindMount(ctx context.Context, cli *client.Client, volumeName string) (bool, error) {
	vol, err := cli.VolumeInspect(ctx, volumeName)
	if err != nil {
		if cerrdefs.IsNotFound(err) {
			return false, nil
		}

		return false, fmt.Errorf("failed to inspect volume %q: %w", volumeName, err)
	}

	return IsBindMount(MountDescriptor{Driver: vol.Driver, DriverOpts: vol.Options}), nil
}
