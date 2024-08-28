package images

import (
	"net/http"
	"strings"

	"github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/http/handler/docker/utils"
	"github.com/portainer/portainer/api/set"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
)

type ImageResponse struct {
	Created  int64    `json:"created"`
	NodeName string   `json:"nodeName"`
	ID       string   `json:"id"`
	Size     int64    `json:"size"`
	Tags     []string `json:"tags"`

	// Used is true if the image is used by at least one container
	// supplied only when withUsage is true
	Used bool `json:"used"`
}

// @id dockerImagesList
// @summary Fetch images
// @description
// @description **Access policy**:
// @tags docker
// @security jwt
// @param environmentId path int true "Environment identifier"
// @param withUsage query boolean false "Include image usage information"
// @produce json
// @success 200 {array} ImageResponse "Success"
// @failure 400 "Bad request"
// @failure 500 "Internal server error"
// @router /docker/{environmentId}/images [get]
func (handler *Handler) imagesList(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := utils.GetClient(r, handler.dockerClientFactory)
	if httpErr != nil {
		return httpErr
	}

	images, err := cli.ImageList(r.Context(), types.ImageListOptions{})
	if err != nil {
		return httperror.InternalServerError("Unable to retrieve Docker images", err)
	}

	// Extract the node name from the custom transport
	nodeNames := make(map[string]string)
	if t, ok := cli.HTTPClient().Transport.(*client.NodeNameTransport); ok {
		nodeNames = t.NodeNames()
	}

	withUsage, err := request.RetrieveBooleanQueryParameter(r, "withUsage", true)
	if err != nil {
		return httperror.BadRequest("Invalid query parameter: withUsage", err)
	}

	imageUsageSet := set.Set[string]{}
	if withUsage {
		containers, err := cli.ContainerList(r.Context(), container.ListOptions{
			All: true,
		})
		if err != nil {
			return httperror.InternalServerError("Unable to retrieve Docker containers", err)
		}

		for _, container := range containers {
			imageUsageSet.Add(container.ImageID)
		}
	}

	imagesList := make([]ImageResponse, len(images))
	for i, image := range images {
		if len(image.RepoTags) == 0 && len(image.RepoDigests) > 0 {
			for _, repoDigest := range image.RepoDigests {
				image.RepoTags = append(image.RepoTags, repoDigest[0:strings.Index(repoDigest, "@")]+":<none>")
			}
		}

		imagesList[i] = ImageResponse{
			Created:  image.Created,
			NodeName: nodeNames[image.ID],
			ID:       image.ID,
			Size:     image.Size,
			Tags:     image.RepoTags,
			Used:     imageUsageSet.Contains(image.ID),
		}
	}

	return response.JSON(w, imagesList)
}
