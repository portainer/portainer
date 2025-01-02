package images

import (
	"context"
	"slices"
	"strings"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	portainer "github.com/portainer/portainer/api"
	consts "github.com/portainer/portainer/api/docker/consts"

	"github.com/opencontainers/go-digest"
	"github.com/patrickmn/go-cache"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
)

// Status constants
const (
	Processing = Status("processing")
	Outdated   = Status("outdated")
	Updated    = Status("updated")
	Skipped    = Status("skipped")
	Preparing  = Status("preparing")
	Error      = Status("error")
)

var (
	statusCache       = cache.New(24*time.Hour, 24*time.Hour)
	remoteDigestCache = cache.New(5*time.Second, 5*time.Second)
	swarmID2NameCache = cache.New(5*time.Second, 5*time.Second)
)

// Status holds Docker image  analysis
type Status string

func (c *DigestClient) ContainersImageStatus(ctx context.Context, containers []types.Container, endpoint *portainer.Endpoint) Status {
	cli, err := c.clientFactory.CreateClient(endpoint, "", nil)
	if err != nil {
		log.Error().Err(err).Msg("cannot create docker client")

		return Error
	}

	statuses := make([]Status, len(containers))
	for i, ct := range containers {
		var nodeName string
		if swarmNodeId := ct.Labels[consts.SwarmNodeIDLabel]; swarmNodeId != "" {
			if swarmNodeName, ok := swarmID2NameCache.Get(swarmNodeId); ok {
				nodeName, _ = swarmNodeName.(string)
			} else {
				node, _, err := cli.NodeInspectWithRaw(ctx, ct.Labels[consts.SwarmNodeIDLabel])
				if err != nil {
					return Error
				}

				nodeName = node.Description.Hostname
				swarmID2NameCache.Set(swarmNodeId, nodeName, 0)
			}
		}

		s, err := c.ContainerImageStatus(ctx, ct.ID, endpoint, nodeName)
		if err != nil {
			statuses[i] = Error
			log.Warn().Str("containerId", ct.ID).Err(err).Msg("error when fetching image status for container")

			continue
		}

		statuses[i] = s

		if s == Outdated || s == Processing {
			break
		}
	}

	return FigureOut(statuses)
}

func FigureOut(statuses []Status) Status {
	if allMatch(statuses, Skipped) {
		return Skipped
	}

	if allMatch(statuses, Preparing) {
		return Preparing
	}

	if contains(statuses, Outdated) {
		return Outdated
	} else if contains(statuses, Processing) {
		return Processing
	} else if contains(statuses, Error) {
		return Error
	}

	return Updated
}

func (c *DigestClient) ContainerImageStatus(ctx context.Context, containerID string, endpoint *portainer.Endpoint, nodeName string) (Status, error) {
	cli, err := c.clientFactory.CreateClient(endpoint, nodeName, nil)
	if err != nil {
		log.Warn().Str("swarmNodeId", nodeName).Msg("Cannot create new docker client.")
	}

	container, err := cli.ContainerInspect(ctx, containerID)
	if err != nil {
		log.Warn().Err(err).Str("containerID", containerID).Msg("Inspect container error.")
		return Skipped, nil
	}

	var imageID string
	if strings.Contains(container.Image, "sha256") {
		imageID = container.Image[strings.Index(container.Image, "sha256"):]
	}

	if imageID == "" {
		return Skipped, nil
	}

	digs := make([]digest.Digest, 0)
	images := make([]*Image, 0)
	if i, err := ParseImage(ParseImageOptions{Name: container.Config.Image}); err == nil {
		images = append(images, &i)
	}

	imageInspect, _, err := cli.ImageInspectWithRaw(ctx, imageID)
	if err != nil {
		log.Debug().Str("imageID", imageID).Msg("inspect failed")
		return Error, err
	}

	if len(imageInspect.RepoDigests) > 0 {
		digs = append(digs, ParseRepoDigests(imageInspect.RepoDigests)...)
	}

	if len(imageInspect.RepoTags) > 0 {
		images = append(images, ParseRepoTags(imageInspect.RepoTags)...)
	}

	s, err := c.checkStatus(images, digs)
	if err != nil {
		log.Debug().Str("image", container.Image).Err(err).Msg("fetching a certain image status")
		return Error, err
	}

	statusCache.Set(imageID, s, 0)

	return s, err
}

func (c *DigestClient) ServiceImageStatus(ctx context.Context, serviceID string, endpoint *portainer.Endpoint) (Status, error) {
	cli, err := c.clientFactory.CreateClient(endpoint, "", nil)
	if err != nil {
		return Error, nil
	}

	containers, err := cli.ContainerList(ctx, container.ListOptions{
		All:     true,
		Filters: filters.NewArgs(filters.Arg("label", consts.SwarmServiceIDLabel+"="+serviceID)),
	})
	if err != nil {
		log.Warn().Err(err).Str("serviceID", serviceID).Msg("cannot list container for the service")
		return Error, err
	}

	nonExistedOrStoppedContainers := make([]types.Container, 0)
	for _, container := range containers {
		if container.State == "exited" || container.State == "stopped" {
			continue
		}

		// When there is a container with the state "Created" under the service, it
		// indicates that the Docker Swarm is replacing the existing task with
		// a new task. At the moment, the state of the new task is "Created", and
		// the state of the old task is "Running".
		// Until the new task runs up, the image status should be set "Preparing"
		if container.State == "created" {
			return Preparing, nil
		}
		nonExistedOrStoppedContainers = append(nonExistedOrStoppedContainers, container)
	}

	if len(nonExistedOrStoppedContainers) == 0 {
		return Preparing, nil
	}

	return c.ContainersImageStatus(ctx, nonExistedOrStoppedContainers, endpoint), nil
}

func (c *DigestClient) checkStatus(images []*Image, digests []digest.Digest) (Status, error) {
	if digests == nil {
		digests = make([]digest.Digest, 0)
	}

	for _, img := range images {
		if img.Digest != "" && !slices.Contains(digests, img.Digest) {
			log.Info().Str("localDigest", img.Domain).Msg("incoming local digest is not nil")
			digests = append([]digest.Digest{img.Digest}, digests...)
		}
	}

	if len(digests) == 0 {
		return Skipped, nil
	}

	var imageStatus Status

	for _, img := range images {
		var remoteDigest digest.Digest
		var err error
		if rd, ok := remoteDigestCache.Get(img.FullName()); ok {
			remoteDigest, _ = rd.(digest.Digest)
		}
		if remoteDigest == "" {
			remoteDigest, err = c.RemoteDigest(*img)
			if err != nil {
				log.Error().Str("image", img.String()).Msg("error when fetch remote digest for image")
				return Error, err
			}
		}
		remoteDigestCache.Set(img.FullName(), remoteDigest, 0)

		log.Debug().Str("image", img.FullName()).Stringer("remote_digest", remoteDigest).
			Int("local_digest_size", len(digests)).
			Msg("Digests")

		// final locals vs remote one
		for _, dig := range digests {
			log.Debug().
				Str("image", img.FullName()).
				Stringer("remote_digest", remoteDigest).
				Stringer("local_digest", dig).
				Msg("Comparing")

			if dig == remoteDigest {
				log.Debug().Str("image", img.FullName()).
					Stringer("remote_digest", remoteDigest).
					Stringer("local_digest", dig).
					Msg("Found a match")
				return Updated, nil
			}
		}
	}

	imageStatus = Outdated

	return imageStatus, nil
}

func CachedResourceImageStatus(resourceID string) (Status, error) {
	if s, ok := statusCache.Get(resourceID); ok {
		return s.(Status), nil
	}

	return "", errors.Errorf("no image found in cache: %s", resourceID)
}

func CacheResourceImageStatus(resourceID string, status Status) {
	statusCache.Set(resourceID, status, 0)
}

func CachedImageDigest(resourceID string) (Status, error) {
	if s, ok := statusCache.Get(resourceID); ok {
		return s.(Status), nil
	}

	return "", errors.Errorf("no image found in cache: %s", resourceID)
}

func EvictImageStatus(resourceID string) {
	statusCache.Delete(resourceID)
}

func contains(statuses []Status, status Status) bool {
	if len(statuses) == 0 {
		return false
	}

	for _, s := range statuses {
		if s == status {
			return true
		}
	}

	return false
}

func allMatch(statuses []Status, status Status) bool {
	if len(statuses) == 0 {
		return false
	}

	for _, s := range statuses {
		if s != status {
			return false
		}
	}

	return true
}
