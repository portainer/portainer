package liboras

import (
	"bytes"
	"context"
	"fmt"

	"github.com/opencontainers/go-digest"
	ocispec "github.com/opencontainers/image-spec/specs-go/v1"
	"oras.land/oras-go/v2/registry/remote"
)

// DeleteManifestByDigest deletes a manifest by its digest
func DeleteManifestByDigest(registryClient *remote.Registry, repository, digestStr string) error {
	ctx := context.Background()

	// Get repository handle
	repo, err := registryClient.Repository(ctx, repository)
	if err != nil {
		return fmt.Errorf("failed to get repository handle: %w", err)
	}

	// Delete the manifest by digest
	manifestDigest, err := digest.Parse(digestStr)
	if err != nil {
		return fmt.Errorf("failed to parse digest: %w", err)
	}

	err = repo.Manifests().Delete(ctx, ocispec.Descriptor{
		Digest: manifestDigest,
	})
	if err != nil {
		return fmt.Errorf("failed to delete manifest: %w", err)
	}

	return nil
}

// AddTagToManifest creates a new tag pointing to an existing manifest
func AddTagToManifest(registryClient *remote.Registry, repository, tagName, targetDigest string, manifestBytes []byte) error {
	ctx := context.Background()

	// Get repository handle
	repo, err := registryClient.Repository(ctx, repository)
	if err != nil {
		return fmt.Errorf("failed to get repository handle: %w", err)
	}

	// Parse the target digest
	parsedDigest, err := digest.Parse(targetDigest)
	if err != nil {
		return fmt.Errorf("failed to parse digest: %w", err)
	}

	// Create descriptor for the manifest
	manifestDescriptor := ocispec.Descriptor{
		MediaType: "application/vnd.oci.image.manifest.v1+json",
		Size:      int64(len(manifestBytes)),
		Digest:    parsedDigest,
	}

	err = repo.Manifests().PushReference(ctx, manifestDescriptor, bytes.NewReader(manifestBytes), tagName)
	if err != nil {
		return fmt.Errorf("failed to tag manifest: %w", err)
	}

	return nil
}
