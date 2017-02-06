package cli

import (
	"time"

	"github.com/portainer/portainer"

	"os"
	"strings"

	"gopkg.in/alecthomas/kingpin.v2"
)

// Service implements the CLIService interface
type Service struct{}

const (
	errInvalidEnpointProtocol = portainer.Error("Invalid endpoint protocol: Portainer only supports unix:// or tcp://")
	errSocketNotFound         = portainer.Error("Unable to locate Unix socket")
	errEndpointsFileNotFound  = portainer.Error("Unable to locate external endpoints file")
	errInvalidSyncInterval    = portainer.Error("Invalid synchronization interval")
)

// ParseFlags parse the CLI flags and return a portainer.Flags struct
func (*Service) ParseFlags(version string) (*portainer.CLIFlags, error) {
	kingpin.Version(version)

	flags := &portainer.CLIFlags{
		Endpoint:          kingpin.Flag("host", "Dockerd endpoint").Short('H').String(),
		Logo:              kingpin.Flag("logo", "URL for the logo displayed in the UI").String(),
		ExternalEndpoints: kingpin.Flag("external-endpoints", "Path to a file defining available endpoints").String(),
		SyncInterval:      kingpin.Flag("sync-interval", "Duration between each synchronization via the external endpoints source").Default(defaultSyncInterval).String(),
		Labels:            pairs(kingpin.Flag("hide-label", "Hide containers with a specific label in the UI").Short('l')),
		Addr:              kingpin.Flag("bind", "Address and port to serve Portainer").Default(defaultBindAddress).Short('p').String(),
		Assets:            kingpin.Flag("assets", "Path to the assets").Default(defaultAssetsDirectory).Short('a').String(),
		Data:              kingpin.Flag("data", "Path to the folder where the data is stored").Default(defaultDataDirectory).Short('d').String(),
		Templates:         kingpin.Flag("templates", "URL to the templates (apps) definitions").Default(defaultTemplatesURL).Short('t').String(),
		NoAuth:            kingpin.Flag("no-auth", "Disable authentication").Default(defaultNoAuth).Bool(),
		TLSVerify:         kingpin.Flag("tlsverify", "TLS support").Default(defaultTLSVerify).Bool(),
		TLSCacert:         kingpin.Flag("tlscacert", "Path to the CA").Default(defaultTLSCACertPath).String(),
		TLSCert:           kingpin.Flag("tlscert", "Path to the TLS certificate file").Default(defaultTLSCertPath).String(),
		TLSKey:            kingpin.Flag("tlskey", "Path to the TLS key").Default(defaultTLSKeyPath).String(),
	}

	kingpin.Parse()
	return flags, nil
}

// ValidateFlags validates the values of the flags.
func (*Service) ValidateFlags(flags *portainer.CLIFlags) error {
	if *flags.Endpoint != "" {
		if !strings.HasPrefix(*flags.Endpoint, "unix://") && !strings.HasPrefix(*flags.Endpoint, "tcp://") {
			return errInvalidEnpointProtocol
		}

		if strings.HasPrefix(*flags.Endpoint, "unix://") {
			socketPath := strings.TrimPrefix(*flags.Endpoint, "unix://")
			if _, err := os.Stat(socketPath); err != nil {
				if os.IsNotExist(err) {
					return errSocketNotFound
				}
				return err
			}
		}
	}

	if *flags.ExternalEndpoints != "" {
		if _, err := os.Stat(*flags.ExternalEndpoints); err != nil {
			if os.IsNotExist(err) {
				return errEndpointsFileNotFound
			}
			return err
		}
	}

	if *flags.SyncInterval != defaultSyncInterval {
		_, err := time.ParseDuration(*flags.SyncInterval)
		if err != nil {
			return errInvalidSyncInterval
		}
	}

	return nil
}
