package images

import (
	"strings"

	"go.podman.io/image/v5/docker"
	"go.podman.io/image/v5/types"
)

func ParseReference(imageStr string) (types.ImageReference, error) {
	if !strings.HasPrefix(imageStr, "//") {
		imageStr = "//" + imageStr
	}
	return docker.ParseReference(imageStr)
}
