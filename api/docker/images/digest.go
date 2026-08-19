package images

import (
	"context"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"

	"github.com/docker/docker/api/types/image"
	dockerclient "github.com/docker/docker/client"
	"github.com/opencontainers/go-digest"
	"github.com/pkg/errors"
	"github.com/rs/zerolog/log"
	"go.podman.io/image/v5/docker"
	imagetypes "go.podman.io/image/v5/types"
)

const digestFetchTimeout = 5 * time.Second

// ClientFactory creates Docker clients for a given environment.
type ClientFactory interface {
	CreateClient(endpoint *portainer.Endpoint, nodeName string, timeout *time.Duration) (*dockerclient.Client, error)
}

// RegistryAuthProvider looks up registry credentials for an image.
type RegistryAuthProvider interface {
	RegistryAuth(image Image) (string, string, error)
}

type DigestClient struct {
	clientFactory  ClientFactory
	sysCtx         *imagetypes.SystemContext
	registryClient RegistryAuthProvider
}

func NewClientWithRegistry(registryClient RegistryAuthProvider, clientFactory ClientFactory) *DigestClient {
	return &DigestClient{
		clientFactory:  clientFactory,
		registryClient: registryClient,
	}
}

func (c *DigestClient) RemoteDigest(ctx context.Context, image Image) (digest.Digest, error) {
	ctx, cancel := context.WithTimeout(ctx, digestFetchTimeout)
	defer cancel()

	// Docker references with both a tag and digest are currently not supported
	if image.Tag != "" && image.Digest != "" {
		if err := image.TrimDigest(); err != nil {
			return "", err
		}
	}

	rmRef, err := ParseReference(image.String())
	if err != nil {
		return "", errors.Wrap(err, "Cannot parse the image reference")
	}

	sysCtx := c.sysCtx
	if c.registryClient != nil {
		username, password, err := c.registryClient.RegistryAuth(image)
		if err != nil {
			log.Info().Str("image up to date indicator", image.String()).Msg("No environment registry credentials found, using anonymous access")
		} else {
			sysCtx = &imagetypes.SystemContext{
				DockerAuthConfig: &imagetypes.DockerAuthConfig{
					Username: username,
					Password: password,
				},
			}
		}
	}

	// Retrieve remote digest through HEAD request
	rmDigest, err := docker.GetDigest(ctx, sysCtx, rmRef)
	if err != nil {
		// Fallback to public registry for hub
		if image.HubLink != "" {
			rmDigest, err = docker.GetDigest(ctx, c.sysCtx, rmRef)
			if err == nil {
				return rmDigest, nil
			}
		}

		log.Debug().Err(err).Msg("get remote digest error")

		return "", errors.Wrap(err, "Cannot get image digest from HEAD request")
	}

	return rmDigest, nil
}

func ParseLocalImage(inspect image.InspectResponse) (*Image, error) {
	if IsLocalImage(inspect) || IsDanglingImage(inspect) {
		return nil, errors.New("the image is not regular")
	}

	fromRepoDigests, err := ParseImage(ParseImageOptions{
		// including image name but no tag
		Name: inspect.RepoDigests[0],
	})
	if err != nil {
		return nil, err
	}

	if IsNoTagImage(inspect) {
		return &fromRepoDigests, nil
	}

	fromRepoTags, err := ParseImage(ParseImageOptions{
		Name: inspect.RepoTags[0],
	})
	if err != nil {
		return nil, err
	}

	fromRepoDigests.Tag = fromRepoTags.Tag

	return &fromRepoDigests, nil
}

func ParseRepoDigests(repoDigests []string) []digest.Digest {
	digests := make([]digest.Digest, 0)
	for _, repoDigest := range repoDigests {
		d := ParseRepoDigest(repoDigest)
		if d == "" {
			continue
		}

		digests = append(digests, d)
	}

	return digests
}

func ParseRepoTags(repoTags []string) []*Image {
	images := make([]*Image, 0)
	for _, repoTag := range repoTags {
		if image := ParseRepoTag(repoTag); image != nil {
			images = append(images, image)
		}
	}

	return images
}

func ParseRepoDigest(repoDigest string) digest.Digest {
	if !strings.ContainsAny(repoDigest, "@") {
		return ""
	}

	d, err := digest.Parse(strings.Split(repoDigest, "@")[1])
	if err != nil {
		log.Warn().Err(err).Str("digest", repoDigest).Msg("skip invalid repo item")

		return ""
	}

	return d
}

func ParseRepoTag(repoTag string) *Image {
	if repoTag == "" {
		return nil
	}

	image, err := ParseImage(ParseImageOptions{
		Name: repoTag,
	})
	if err != nil {
		log.Warn().Err(err).Str("repoTag", repoTag).Msg("RepoTag cannot be parsed.")

		return nil
	}

	return &image
}
