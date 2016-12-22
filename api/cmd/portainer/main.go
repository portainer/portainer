package main // import "github.com/portainer/portainer"

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt"
	"github.com/portainer/portainer/cli"
	"github.com/portainer/portainer/crypto"
	"github.com/portainer/portainer/file"
	"github.com/portainer/portainer/http"
	"github.com/portainer/portainer/jwt"

	"log"
)

func main() {
	var cli portainer.CLIService = &cli.Service{}
	flags, err := cli.ParseFlags(portainer.APIVersion)
	if err != nil {
		log.Fatal(err)
	}

	err = cli.ValidateFlags(flags)
	if err != nil {
		log.Fatal(err)
	}

	settings := &portainer.Settings{
		Swarm:        *flags.Swarm,
		HiddenLabels: *flags.Labels,
		Logo:         *flags.Logo,
	}

	var store = bolt.NewStore(*flags.Data)
	err = store.Open()
	if err != nil {
		log.Fatal(err)
	}
	defer store.Close()

	jwtService, err := jwt.NewService()
	if err != nil {
		log.Fatal(err)
	}

	fileService, err := file.NewService(*flags.Data)
	if err != nil {
		log.Fatal(err)
	}

	var cryptoService portainer.CryptoService = &crypto.Service{}

	var activeEndpoint *portainer.Endpoint
	if *flags.Endpoint != "" {
		activeEndpoint = &portainer.Endpoint{
			URL:           *flags.Endpoint,
			TLS:           *flags.TLSVerify,
			TLSCACertPath: *flags.TLSCacert,
			TLSCertPath:   *flags.TLSCert,
			TLSKeyPath:    *flags.TLSKey,
		}
	}

	var server portainer.Server = &http.Server{
		BindAddress:     *flags.Addr,
		AssetsPath:      *flags.Assets,
		Settings:        settings,
		TemplatesURL:    *flags.Templates,
		UserService:     store.UserService,
		EndpointService: store.EndpointService,
		CryptoService:   cryptoService,
		JWTService:      jwtService,
		FileService:     fileService,
		ActiveEndpoint:  activeEndpoint,
	}

	log.Printf("Starting Portainer on %s", *flags.Addr)
	err = server.Start()
	if err != nil {
		log.Fatal(err)
	}
}
