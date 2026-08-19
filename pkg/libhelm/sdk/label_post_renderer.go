package sdk

import (
	"bytes"

	"github.com/portainer/portainer/api/kubernetes"
	"github.com/rs/zerolog/log"
	"helm.sh/helm/v4/pkg/postrenderer"
)

// Ensure appLabelsPostRenderer implements the postrender.PostRenderer interface.
var _ postrenderer.PostRenderer = &appLabelsPostRenderer{}

// appLabelsPostRenderer is an in-process Helm post-renderer that injects
// Portainer app labels into every Kubernetes resource in the rendered manifests.
type appLabelsPostRenderer struct {
	labels map[string]string
}

func (r *appLabelsPostRenderer) Run(renderedManifests *bytes.Buffer) (*bytes.Buffer, error) {
	labeled, err := kubernetes.AddAppLabels(renderedManifests.Bytes(), r.labels)
	if err != nil {
		log.Debug().Err(err).Interface("labels", r.labels).Msg("Failed to add app labels to rendered manifests")
		return nil, err
	}

	return bytes.NewBuffer(labeled), nil
}
