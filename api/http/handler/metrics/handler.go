package metrics

import (
	"github.com/google/gops/agent"
	"github.com/gorilla/mux"
	"github.com/portainer/portainer/api/http/security"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
)

// Handler is the HTTP handler used to handle Prometheus metrics operations.
type Handler struct {
	*mux.Router
}

// NewHandler creates a handler to manage settings operations.
func NewHandler(bouncer *security.RequestBouncer) *Handler {
	h := &Handler{
		Router: mux.NewRouter(),
	}
	h.Handle("/metrics", promhttp.Handler())
	//	h.Handle("/metrics", bouncer.PublicAccess(promhttp.Handler()))
	logrus.Debugf("metricsHandler creation")

	// also add gops agent support
	if err := agent.Listen(agent.Options{}); err != nil {
		logrus.WithError(err).Debugf("failed to start gops agent")
	} else {
		logrus.Debug("started gops agent")
	}

	return h
}
