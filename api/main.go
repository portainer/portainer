package main // import "github.com/cloudinovasi/ui-for-docker"

import (
	"gopkg.in/alecthomas/kingpin.v2"
)

// main is the entry point of the program
func main() {
	kingpin.Version("1.6.0")
	var (
		endpoint   = kingpin.Flag("host", "Dockerd endpoint").Default("unix:///var/run/docker.sock").Short('H').String()
		addr       = kingpin.Flag("bind", "Address and port to serve UI For Docker").Default(":9000").Short('p').String()
		assets     = kingpin.Flag("assets", "Path to the assets").Default(".").Short('a').String()
		data       = kingpin.Flag("data", "Path to the data").Default(".").Short('d').String()
		tlsverify  = kingpin.Flag("tlsverify", "TLS support").Default("false").Bool()
		tlscacert  = kingpin.Flag("tlscacert", "Path to the CA").Default("/certs/ca.pem").String()
		tlscert    = kingpin.Flag("tlscert", "Path to the TLS certificate file").Default("/certs/cert.pem").String()
		tlskey     = kingpin.Flag("tlskey", "Path to the TLS key").Default("/certs/key.pem").String()
		swarm      = kingpin.Flag("swarm", "Swarm cluster support").Default("false").Short('s').Bool()
		labels     = pairs(kingpin.Flag("hide-label", "Hide containers with a specific label in the UI").Short('l'))
		registries = pairs(kingpin.Flag("registries", "Supported Docker registries").Short('r'))
		logo      = kingpin.Flag("logo", "URL for the logo displayed in the UI").String()
	)
	kingpin.Parse()

	apiConfig := apiConfig{
		Endpoint:      *endpoint,
		BindAddress:   *addr,
		AssetPath:     *assets,
		DataPath:      *data,
		SwarmSupport:  *swarm,
		TLSEnabled:    *tlsverify,
		TLSCACertPath: *tlscacert,
		TLSCertPath:   *tlscert,
		TLSKeyPath:    *tlskey,
	}

	settings := &Settings{
		Swarm:        *swarm,
		HiddenLabels: *labels,
		Registries:   *registries,
		Logo:         *logo,
	}

	api := newAPI(apiConfig)
	api.run(settings)
}
