package libkubectl

import (
	"context"
	"fmt"
)

// DryRunResult reports the outcome of a dry-run apply for a single resource.
// Message carries the reason a resource was rejected and is empty on success.
// DocumentIndex is the zero-based position of the document among the non-empty
// documents of all manifests, and identifies a document that failed before its
// resource could be named.
type DryRunResult struct {
	Kind          string
	Name          string
	Namespace     string
	DocumentIndex int
	Success       bool
	Message       string
}

// ApplyDryRun validates Kubernetes manifests against the API server with Server-Side Apply,
// without persisting anything. Each manifest may hold several documents separated by "---".
// A resource rejected by the API server is reported in its own result rather than aborting
// the run, so the caller sees every problem at once. An error is returned when the run could
// not be started at all, or when the context ended before every document was validated.
//
// A resource that lives in a namespace created by another document of the same run is
// reported as rejected: the dry-run never persists that namespace, so the API server has
// nothing to validate the resource against. Applying the same manifests for real succeeds.
func (c *Client) ApplyDryRun(ctx context.Context, manifests []string) ([]DryRunResult, error) {
	setup, err := c.newApplySetup(ctx)
	if err != nil {
		return nil, err
	}

	return c.dryRunManifests(ctx, setup, manifests)
}

func (c *Client) dryRunManifests(ctx context.Context, setup *applySetup, manifests []string) ([]DryRunResult, error) {
	results := []DryRunResult{}
	documentIndex := -1

	for _, manifest := range manifests {
		documents, err := splitManifestDocuments(manifest)
		if err != nil {
			return nil, err
		}

		for _, document := range documents {
			documentIndex++

			applied, err := c.applyResource(ctx, setup, []byte(document), true)
			if err != nil && ctx.Err() != nil {
				// The remaining documents were never validated, so reporting them as
				// rejected would blame the manifests for a timeout or a disconnect.
				return nil, fmt.Errorf("dry-run interrupted after validating %d resources: %w", len(results), ctx.Err())
			}
			if err == nil && applied.Kind == "" {
				// A comment-only document holds no resource to validate.
				continue
			}

			result := DryRunResult{
				Kind:          applied.Kind,
				Name:          applied.Name,
				Namespace:     applied.Namespace,
				DocumentIndex: documentIndex,
				Success:       err == nil,
			}
			if err != nil {
				result.Message = err.Error()
			}

			results = append(results, result)
		}
	}

	return results, nil
}
