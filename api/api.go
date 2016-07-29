package main // import "github.com/cloudinovasi/ui-for-docker"

import (
	"gopkg.in/alecthomas/kingpin.v2"
	"log"
	"net/http"
)

// main is the entry point of the program
func main() {
	kingpin.Version("1.5.0")
	var (
		endpoint  = kingpin.Flag("host", "Dockerd endpoint").Default("unix:///var/run/docker.sock").Short('H').String()
		addr      = kingpin.Flag("bind", "Address and port to serve UI For Docker").Default(":9000").Short('p').String()
		assets    = kingpin.Flag("assets", "Path to the assets").Default(".").Short('a').String()
		data      = kingpin.Flag("data", "Path to the data").Default(".").Short('d').String()
		swarm     = kingpin.Flag("swarm", "Swarm cluster support").Default("false").Short('s').Bool()
		tlsverify = kingpin.Flag("tlsverify", "TLS support").Default("false").Bool()
		tlscacert = kingpin.Flag("tlscacert", "Path to the CA").Default("/certs/ca.pem").String()
		tlscert   = kingpin.Flag("tlscert", "Path to the TLS certificate file").Default("/certs/cert.pem").String()
		tlskey    = kingpin.Flag("tlskey", "Path to the TLS key").Default("/certs/key.pem").String()
		labels    = pairs(kingpin.Flag("hide-label", "Hide containers with a specific label in the UI").Short('l'))
	)
	kingpin.Parse()

	configuration := newConfig(*swarm, *labels)
	tlsFlags := newTLSFlags(*tlsverify, *tlscacert, *tlscert, *tlskey)

	handler := newHandler(*assets, *data, *endpoint, configuration, tlsFlags)
	if err := http.ListenAndServe(*addr, handler); err != nil {
		log.Fatal(err)
	}
}
