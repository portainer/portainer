package cli

import (
	"github.com/portainer/portainer"

	"gopkg.in/alecthomas/kingpin.v2"
	"os"
	"strings"
)

// Service implements the CLIService interface
type Service struct{}

const (
	errInvalidEnpointProtocol = portainer.Error("Invalid endpoint protocol: Portainer only supports unix:// or tcp://")
	errSocketNotFound         = portainer.Error("Unable to locate Unix socket")
)

// ParseFlags parse the CLI flags and return a portainer.Flags struct
func (*Service) ParseFlags(version string) (*portainer.CLIFlags, error) {
	kingpin.Version(version)

	flags := &portainer.CLIFlags{
		Endpoint:  kingpin.Flag("host", "Dockerd endpoint").Short('H').String(),
		Logo:      kingpin.Flag("logo", "URL for the logo displayed in the UI").String(),
		Labels:    pairs(kingpin.Flag("hide-label", "Hide containers with a specific label in the UI").Short('l')),
		Addr:      kingpin.Flag("bind", "Address and port to serve Portainer").Default(":9000").Short('p').String(),
		Assets:    kingpin.Flag("assets", "Path to the assets").Default(".").Short('a').String(),
		Data:      kingpin.Flag("data", "Path to the folder where the data is stored").Default("/data").Short('d').String(),
		Swarm:     kingpin.Flag("swarm", "Swarm cluster support").Default("false").Short('s').Bool(),
		Templates: kingpin.Flag("templates", "URL to the templates (apps) definitions").Default("https://raw.githubusercontent.com/portainer/templates/master/templates.json").Short('t').String(),
		TLSVerify: kingpin.Flag("tlsverify", "TLS support").Default("false").Bool(),
		TLSCacert: kingpin.Flag("tlscacert", "Path to the CA").Default("/certs/ca.pem").String(),
		TLSCert:   kingpin.Flag("tlscert", "Path to the TLS certificate file").Default("/certs/cert.pem").String(),
		TLSKey:    kingpin.Flag("tlskey", "Path to the TLS key").Default("/certs/key.pem").String(),
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

	return nil
}
