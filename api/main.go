package main // import "github.com/portainer/portainer"

import (
	"github.com/portainer/portainer/cli"
)

const (
	// Version number of portainer API
	Version = "1.10.2"
)

// main is the entry point of the program
func main() {

	flags := cli.SetupCLIFlags(Version)

	apiConfig := apiConfig{
		Endpoint:      *flags.Endpoint,
		BindAddress:   *flags.Addr,
		AssetPath:     *flags.Assets,
		DataPath:      *flags.Data,
		SwarmSupport:  *flags.Swarm,
		TLSEnabled:    *flags.TLSVerify,
		TLSCACertPath: *flags.TLSCacert,
		TLSCertPath:   *flags.TLSCert,
		TLSKeyPath:    *flags.TLSKey,
		TemplatesURL:  *flags.Templates,
	}

	settings := &Settings{
		Swarm:        *flags.Swarm,
		HiddenLabels: *flags.Labels,
		Logo:         *flags.Logo,
	}

	api := newAPI(apiConfig)
	api.run(settings)
}
