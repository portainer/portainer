package kubernetes

import (
	"errors"
	"io"
	"net/http"
	"time"

	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/request"
	"github.com/portainer/portainer/pkg/libhttp/response"
	"github.com/portainer/portainer/pkg/libkubectl"
	"github.com/rs/zerolog/log"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// KubernetesNodeResponse is the documented response model for cluster node endpoints.
type KubernetesNodeResponse corev1.Node

// drainNodePayload describes the optional drain options for a node, mirroring
// the flags exposed by "kubectl drain". A zero-value payload (or no body at
// all) falls back to libkubectl.DefaultDrainOptions(). Fields are pointers so
// an omitted field can be distinguished from an explicitly provided
// zero-value (e.g. GracePeriodSeconds: 0 means "delete immediately", which is
// different from not sending the field at all).
type drainNodePayload struct {
	// Force allows deletion of standalone pods not managed by a controller.
	Force *bool `example:"false"`
	// TimeoutSeconds is the overall time to wait for the drain to complete. Defaults to 60 when omitted.
	TimeoutSeconds *int `example:"60"`
	// GracePeriodSeconds overrides each pod's termination grace period. -1 uses the pod's own grace period.
	GracePeriodSeconds *int `example:"-1"`
	// IgnoreDaemonSets skips DaemonSet-managed pods, which would otherwise block the drain.
	IgnoreDaemonSets *bool `example:"true"`
	// DeleteEmptyDirData allows eviction of pods using emptyDir volumes, whose data is lost once the pod is deleted.
	DeleteEmptyDirData *bool `example:"true"`
	// DisableEviction forces the use of direct pod deletion instead of the eviction API, ignoring any configured PodDisruptionBudgets.
	DisableEviction *bool `example:"false"`
}

func (payload *drainNodePayload) Validate(r *http.Request) error {
	if payload.TimeoutSeconds != nil && *payload.TimeoutSeconds < 0 {
		return errors.New("timeoutSeconds must be zero or a positive number of seconds")
	}

	if payload.GracePeriodSeconds != nil && *payload.GracePeriodSeconds < -1 {
		return errors.New("gracePeriodSeconds must be -1 or a positive number of seconds")
	}

	return nil
}

func (payload *drainNodePayload) drainOptions() libkubectl.DrainOptions {
	opts := libkubectl.DefaultDrainOptions()
	if payload.Force != nil {
		opts.Force = *payload.Force
	}
	if payload.GracePeriodSeconds != nil {
		opts.GracePeriodSeconds = *payload.GracePeriodSeconds
	}
	if payload.IgnoreDaemonSets != nil {
		opts.IgnoreAllDaemonSets = *payload.IgnoreDaemonSets
	}
	if payload.DeleteEmptyDirData != nil {
		opts.DeleteEmptyDirData = *payload.DeleteEmptyDirData
	}
	if payload.DisableEviction != nil {
		opts.DisableEviction = *payload.DisableEviction
	}
	if payload.TimeoutSeconds != nil {
		opts.Timeout = time.Duration(*payload.TimeoutSeconds) * time.Second
	}

	return opts
}

// @id GetKubernetesNodes
// @summary Get Kubernetes cluster nodes
// @description Returns the list of Kubernetes nodes for the selected environment.
// @description **Access policy**: Authenticated user.
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @produce json
// @param id path int true "Environment(Endpoint) identifier"
// @success 200 {array} KubernetesNodeResponse "Success"
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource."
// @failure 500 "Server error occurred while attempting to retrieve the list of nodes."
// @router /kubernetes/{id}/nodes [get]
func (handler *Handler) getKubernetesNodes(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	cli, httpErr := handler.getProxyKubeClient(r)
	if httpErr != nil {
		log.Error().
			Err(httpErr).
			Int("status_code", httpErr.StatusCode).
			Str("message", httpErr.Message).
			Str("context", "getKubernetesNodes").
			Msg("Unable to prepare kube client")
		return httpErr
	}

	nodes, err := cli.GetClusterNodes()
	if err != nil {
		if k8serrors.IsUnauthorized(err) {
			log.Error().Err(err).Str("context", "getKubernetesNodes").Msg("Unable to retrieve nodes")
			return httperror.Unauthorized("Unable to retrieve nodes", err)
		}

		if k8serrors.IsForbidden(err) {
			log.Error().Err(err).Str("context", "getKubernetesNodes").Msg("Unable to retrieve nodes")
			return httperror.Forbidden("Unable to retrieve nodes", err)
		}

		log.Error().Err(err).Str("context", "getKubernetesNodes").Msg("Unable to retrieve nodes")
		return httperror.InternalServerError("Unable to retrieve nodes", err)
	}

	return response.JSON(w, nodes)
}

// @id drainNode
// @summary Drain a Kubernetes node
// @description Drain a Kubernetes node by safely evicting all pods from the node, preparing it for maintenance or removal
// @description **Access policy**: authenticated
// @tags kubernetes
// @security ApiKeyAuth || jwt
// @accept json
// @param id path int true "Environment(Endpoint) identifier"
// @param name path string true "Name of the node to drain"
// @param body body drainNodePayload false "Drain options, matching kubectl drain flags. Defaults are applied to any omitted field."
// @success 204 "Success"
// @failure 400 "Invalid request, such as missing required fields or fields not meeting validation criteria."
// @failure 401 "Unauthorized access - the user is not authenticated or does not have the necessary permissions. Ensure that you have provided a valid API key or JWT token, and that you have the required permissions."
// @failure 403 "Permission denied - the user is authenticated but does not have the necessary permissions to access the requested resource or perform the specified operation. Check your user roles and permissions."
// @failure 404 "Unable to find an environment with the specified identifier or unable to find the specified node."
// @failure 500 "Server error occurred while attempting to drain node."
// @router /kubernetes/{id}/nodes/{name}/drain [post]
func (handler *Handler) drainNode(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	name, err := request.RetrieveRouteVariableValue(r, "name")
	if err != nil {
		log.Error().Err(err).Str("context", "drainNode").Msg("Invalid node name route variable")
		return httperror.BadRequest("Invalid node name route variable", err)
	}

	var payload drainNodePayload
	if err := request.DecodeAndValidateJSONPayload(r, &payload); err != nil && !errors.Is(err, io.EOF) {
		log.Error().Err(err).Str("context", "drainNode").Msg("Invalid request payload")
		return httperror.BadRequest("Invalid request payload", err)
	}

	kubeCtlAccess, err := handler.getLibKubectlAccess(r)
	if err != nil {
		log.Error().Err(err).Str("context", "drainNode").Str("node name", name).Msg("Unable to get a Kubernetes client for the user")
		return httperror.InternalServerError("Unable to get a Kubernetes client for the user", err)
	}

	client, err := libkubectl.NewClient(kubeCtlAccess, "", "", true)
	if err != nil {
		log.Error().Err(err).Str("context", "drainNode").Msg("Failed to create kubernetes client")
		return httperror.InternalServerError("an error occurred during the drainNode operation, failed to create kubernetes client. Error: ", err)
	}

	output, err := client.DrainNode(name, payload.drainOptions())
	if err != nil {
		log.Error().Err(err).Str("context", "drainNode").Msg("Failed to drain node")
		return httperror.InternalServerError("an error occurred during the drainNode operation, failed to drain node. Error: ", err)
	}
	log.Debug().Str("context", "drainNode").Str("node name", name).Str("output", output).Msg("Drained node")

	return response.Empty(w)
}
