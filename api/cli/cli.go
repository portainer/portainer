package cli

import (
	"github.com/portainer/portainer/common"
	"gopkg.in/alecthomas/kingpin.v2"
)

// Flags define all the flags available via the CLI
type Flags struct {
	Endpoint  *string
	Addr      *string
	Assets    *string
	Data      *string
	TLSVerify *bool
	TLSCacert *string
	TLSCert   *string
	TLSKey    *string
	Swarm     *bool
	Labels    *[]common.Pair
	Logo      *string
	Templates *string
}

// SetupCLIFlags setup the CLI flags and return a pointer to a Flags struct
func SetupCLIFlags(version string) *Flags {
	kingpin.Version(version)

	flags := &Flags{
		Endpoint:  kingpin.Flag("host", "Dockerd endpoint").Default("unix:///var/run/docker.sock").Short('H').String(),
		Addr:      kingpin.Flag("bind", "Address and port to serve Portainer").Default(":9000").Short('p').String(),
		Assets:    kingpin.Flag("assets", "Path to the assets").Default(".").Short('a').String(),
		Data:      kingpin.Flag("data", "Path to the folder where the data is stored").Default("/data").Short('d').String(),
		TLSVerify: kingpin.Flag("tlsverify", "TLS support").Default("false").Bool(),
		TLSCacert: kingpin.Flag("tlscacert", "Path to the CA").Default("/certs/ca.pem").String(),
		TLSCert:   kingpin.Flag("tlscert", "Path to the TLS certificate file").Default("/certs/cert.pem").String(),
		TLSKey:    kingpin.Flag("tlskey", "Path to the TLS key").Default("/certs/key.pem").String(),
		Swarm:     kingpin.Flag("swarm", "Swarm cluster support").Default("false").Short('s').Bool(),
		Labels:    pairs(kingpin.Flag("hide-label", "Hide containers with a specific label in the UI").Short('l')),
		Logo:      kingpin.Flag("logo", "URL for the logo displayed in the UI").String(),
		Templates: kingpin.Flag("templates", "URL to the templates (apps) definitions").Default("https://raw.githubusercontent.com/portainer/templates/master/templates.json").Short('t').String(),
	}
	kingpin.Parse()
	return flags
}
