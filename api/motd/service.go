package motd

import (
	"context"
	"strings"
	"sync/atomic"
	"time"

	"github.com/portainer/portainer/api/http/client"
	"github.com/portainer/portainer/pkg/libcrypto"
	libclient "github.com/portainer/portainer/pkg/libhttp/client"
	"github.com/portainer/portainer/pkg/schedule"
	"github.com/rs/zerolog/log"

	"github.com/segmentio/encoding/json"
)

const refreshInterval = 6 * time.Hour

// Motd holds the processed message of the day data.
type Motd struct {
	Title         string            `json:"Title"`
	Message       string            `json:"Message"`
	ContentLayout map[string]string `json:"ContentLayout"`
	Style         string            `json:"Style"`
	Hash          []byte            `json:"Hash"`
}

// Service fetches and caches the MOTD from an external URL.
type Service struct {
	cached  atomic.Pointer[Motd]
	motdURL string
}

// NewService creates a new MOTD service that fetches from motdURL.
func NewService(motdURL string) *Service {
	return &Service{
		motdURL: motdURL,
	}
}

// Start warms the cache immediately and refreshes it every refreshInterval.
func (s *Service) Start(ctx context.Context) {
	if err := libclient.ExternalRequestDisabled(s.motdURL); err != nil {
		return
	}

	go s.refresh()
	go schedule.RunOnInterval(ctx, refreshInterval, s.refresh, nil)
}

// GetCached returns the cached MOTD
func (s *Service) GetCached() Motd {
	motd := s.cached.Load()
	if motd == nil {
		return Motd{}
	}

	return *motd
}

type motdData struct {
	Title         string            `json:"title"`
	Message       []string          `json:"message"`
	ContentLayout map[string]string `json:"contentLayout"`
	Style         string            `json:"style"`
}

func (s *Service) refresh() {
	if err := libclient.ExternalRequestDisabled(s.motdURL); err != nil {
		log.Debug().Err(err).Msg("External request disabled: MOTD")

		s.cached.Store(nil)

		return
	}

	raw, err := client.Get(s.motdURL, 0)
	if err != nil {
		log.Debug().Err(err).Msg("Failed to fetch MOTD")
		return
	}

	var data motdData
	if err := json.Unmarshal(raw, &data); err != nil {
		log.Debug().Err(err).Msg("Failed to parse MOTD")
		return
	}

	message := strings.Join(data.Message, "\n")
	hash := libcrypto.InsecureHashFromBytes([]byte(message))

	s.cached.Store(&Motd{
		Title:         data.Title,
		Message:       message,
		Hash:          hash,
		ContentLayout: data.ContentLayout,
		Style:         data.Style,
	})
}
