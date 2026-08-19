package kubernetes

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/portainer/portainer/pkg/libkubectl"
	"github.com/rs/zerolog/log"
)

// dryRunTimeout bounds a dry-run so a large manifest set sent to a slow cluster
// cannot hold the request open indefinitely.
const dryRunTimeout = 30 * time.Second

const (
	dryRunStatusPass = "pass"
	dryRunStatusFail = "fail"
)

type manifestDryRunPayload struct {
	// The manifests to validate. Each entry may hold several YAML documents separated by "---".
	Manifests []string `json:"manifests" example:"apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: app-config"`
	// The namespace applied to namespaced resources that do not declare one. A resource declaring a different namespace is rejected.
	Namespace string `json:"namespace" example:"default"`
}

func (payload *manifestDryRunPayload) Validate(r *http.Request) error {
	for _, manifest := range payload.Manifests {
		if strings.TrimSpace(manifest) != "" {
			return nil
		}
	}

	return errors.New("at least one manifest is required")
}

// manifestDryRunResult reports whether a single resource passed server-side validation.
type manifestDryRunResult struct {
	Kind      string `json:"kind" example:"ConfigMap"`
	Name      string `json:"name" example:"app-config"`
	Namespace string `json:"namespace" example:"default"`
	// The zero-based position of the document among the non-empty documents of all manifests. It identifies a document rejected before its resource could be named, such as malformed YAML.
	DocumentIndex int `json:"documentIndex" example:"0"`
	// Either "pass" or "fail".
	Status string `json:"status" example:"pass"`
	// The reason the resource was rejected. Empty when the resource passed.
	Message string `json:"message"`
}

type manifestDryRunResponse struct {
	Results []manifestDryRunResult `json:"results"`
}

// @id DryRunKubernetesManifests
// @summary Validate Kubernetes manifests without applying them
// @description Validate Kubernetes manifests against the cluster with a server-side dry-run apply, without persisting anything.
// @description Each resource is reported on its own, so a rejected resource does not hide the outcome of the others.
// @description The dry-run runs with the permissions of the requesting user, so it also surfaces missing permissions.
// @description A resource living in a namespace created by another manifest of the same request is reported as failed, because the dry-run never persists that namespace.
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @param body body manifestDryRunPayload true "The manifests to validate"
// @success 200 {object} manifestDryRunResponse "Success"
// @failure 400 "Invalid request payload, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier."
// @failure 500 "Server error occurred while attempting to validate the manifests."
// @router /kubernetes/{id}/manifests/dry_run [post]
func (handler *Handler) dryRunKubernetesManifests(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	var payload manifestDryRunPayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil {
		log.Error().Err(err).Str("context", "dryRunKubernetesManifests").Msg("Invalid request payload")
		return httperror.BadRequest("Invalid request payload", err)
	}

	libKubectlAccess, err := handler.getLibKubectlAccess(r)
	if err != nil {
		log.Error().Err(err).Str("context", "dryRunKubernetesManifests").Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("an error occurred during the dryRunKubernetesManifests operation, failed to get libKubectlAccess. Error: ", err)
	}

	client, err := libkubectl.NewClient(libKubectlAccess, payload.Namespace, "", true)
	if err != nil {
		log.Error().Err(err).Str("context", "dryRunKubernetesManifests").Msg("Failed to create kubernetes client")
		return httperror.InternalServerError("an error occurred during the dryRunKubernetesManifests operation, failed to create kubernetes client. Error: ", err)
	}

	ctx, cancel := context.WithTimeout(r.Context(), dryRunTimeout)
	defer cancel()

	results, err := client.ApplyDryRun(ctx, payload.Manifests)
	if err != nil {
		log.Error().Err(err).Str("context", "dryRunKubernetesManifests").Msg("Failed to dry-run the manifests")
		return httperror.InternalServerError("an error occurred during the dryRunKubernetesManifests operation, failed to dry-run the manifests. Error: ", err)
	}

	return response.JSON(w, manifestDryRunResponse{Results: toManifestDryRunResults(results)})
}

func toManifestDryRunResults(results []libkubectl.DryRunResult) []manifestDryRunResult {
	converted := make([]manifestDryRunResult, len(results))

	for i, result := range results {
		status := dryRunStatusFail
		if result.Success {
			status = dryRunStatusPass
		}

		converted[i] = manifestDryRunResult{
			Kind:          result.Kind,
			Name:          result.Name,
			Namespace:     result.Namespace,
			DocumentIndex: result.DocumentIndex,
			Status:        status,
			Message:       result.Message,
		}
	}

	return converted
}
