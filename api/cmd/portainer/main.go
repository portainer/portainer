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
		HiddenLabels:   *flags.Labels,
		Logo:           *flags.Logo,
		Authentication: !*flags.NoAuth,
		Analytics:      !*flags.NoAnalytics,
	}

	fileService, err := file.NewService(*flags.Data, "")
	if err != nil {
		log.Fatal(err)
	}

	var store = bolt.NewStore(*flags.Data)
	err = store.Open()
	if err != nil {
		log.Fatal(err)
	}
	defer store.Close()

	var jwtService portainer.JWTService
	if !*flags.NoAuth {
		jwtService, err = jwt.NewService()
		if err != nil {
			log.Fatal(err)
		}
	}

	var cryptoService portainer.CryptoService = &crypto.Service{}

	// Initialize the active endpoint from the CLI only if there is no
	// endpoint defined yet.
	if *flags.Endpoint != "" {
		var endpoints []portainer.Endpoint
		endpoints, err = store.EndpointService.Endpoints()
		if err != nil {
			log.Fatal(err)
		}
		if len(endpoints) == 0 {
			endpoint := &portainer.Endpoint{
				Name:          "primary",
				URL:           *flags.Endpoint,
				TLS:           *flags.TLSVerify,
				TLSCACertPath: *flags.TLSCacert,
				TLSCertPath:   *flags.TLSCert,
				TLSKeyPath:    *flags.TLSKey,
			}
			err = store.EndpointService.CreateEndpoint(endpoint)
			if err != nil {
				log.Fatal(err)
			}
		} else {
			log.Println("Instance already has defined endpoints. Skipping the endpoint defined via CLI.")
		}
	}

	// Initialize the active endpoint from the CLI only if there is no
	// active endpoint defined yet.
	// var activeEndpoint *portainer.Endpoint
	// if *flags.Endpoint != "" {
	// 	activeEndpoint, err = store.EndpointService.GetActive()
	// 	if err == portainer.ErrEndpointNotFound {
	// 		activeEndpoint = &portainer.Endpoint{
	// 			Name:          "primary",
	// 			URL:           *flags.Endpoint,
	// 			TLS:           *flags.TLSVerify,
	// 			TLSCACertPath: *flags.TLSCacert,
	// 			TLSCertPath:   *flags.TLSCert,
	// 			TLSKeyPath:    *flags.TLSKey,
	// 		}
	// 		err = store.EndpointService.CreateEndpoint(activeEndpoint)
	// 		if err != nil {
	// 			log.Fatal(err)
	// 		}
	// 	} else if err != nil {
	// 		log.Fatal(err)
	// 	}
	// }

	var server portainer.Server = &http.Server{
		BindAddress:     *flags.Addr,
		AssetsPath:      *flags.Assets,
		Settings:        settings,
		TemplatesURL:    *flags.Templates,
		AuthDisabled:    *flags.NoAuth,
		UserService:     store.UserService,
		EndpointService: store.EndpointService,
		CryptoService:   cryptoService,
		JWTService:      jwtService,
		FileService:     fileService,
		// ActiveEndpoint:  activeEndpoint,
	}

	log.Printf("Starting Portainer on %s", *flags.Addr)
	err = server.Start()
	if err != nil {
		log.Fatal(err)
	}
}
