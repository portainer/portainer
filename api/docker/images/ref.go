package images

import (
	"fmt"
	"strings"

	"github.com/containers/image/v5/docker"
	"github.com/containers/image/v5/types"
)

func ParseReference(imageStr string) (types.ImageReference, error) {
	if !strings.HasPrefix(imageStr, "//") {
		imageStr = fmt.Sprintf("//%s", imageStr)
	}
	return docker.ParseReference(imageStr)
}
