package main // import "github.com/portainer/portainer"

import (
	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt"
	"github.com/portainer/portainer/cli"
	"github.com/portainer/portainer/cron"
	"github.com/portainer/portainer/crypto"
	"github.com/portainer/portainer/file"
	"github.com/portainer/portainer/http"
	"github.com/portainer/portainer/jwt"

	"log"
)

func initCLI() *portainer.CLIFlags {
	var cli portainer.CLIService = &cli.Service{}
	flags, err := cli.ParseFlags(portainer.APIVersion)
	if err != nil {
		log.Fatal(err)
	}

	err = cli.ValidateFlags(flags)
	if err != nil {
		log.Fatal(err)
	}
	return flags
}

func initFileService(dataStorePath string) portainer.FileService {
	fileService, err := file.NewService(dataStorePath, "")
	if err != nil {
		log.Fatal(err)
	}
	return fileService
}

func initStore(dataStorePath string) *bolt.Store {
	var store = bolt.NewStore(dataStorePath)
	err := store.Open()
	if err != nil {
		log.Fatal(err)
	}
	return store
}

func initJWTService(authenticationEnabled bool) portainer.JWTService {
	if authenticationEnabled {
		jwtService, err := jwt.NewService()
		if err != nil {
			log.Fatal(err)
		}
		return jwtService
	}
	return nil
}

func initCryptoService() portainer.CryptoService {
	return &crypto.Service{}
}

func initEndpointWatcher(endpointService portainer.EndpointService, externalEnpointFile string, syncInterval string) bool {
	authorizeEndpointMgmt := true
	if externalEnpointFile != "" {
		authorizeEndpointMgmt = false
		log.Println("Using external endpoint definition. Endpoint management via the API will be disabled.")
		endpointWatcher := cron.NewWatcher(endpointService, syncInterval)
		err := endpointWatcher.WatchEndpointFile(externalEnpointFile)
		if err != nil {
			log.Fatal(err)
		}
	}
	return authorizeEndpointMgmt
}

func initSettings(authorizeEndpointMgmt bool, flags *portainer.CLIFlags) *portainer.Settings {
	return &portainer.Settings{
		HiddenLabels:       *flags.Labels,
		Logo:               *flags.Logo,
		Authentication:     !*flags.NoAuth,
		EndpointManagement: authorizeEndpointMgmt,
	}
}

func retrieveFirstEndpointFromDatabase(endpointService portainer.EndpointService) *portainer.Endpoint {
	endpoints, err := endpointService.Endpoints()
	if err != nil {
		log.Fatal(err)
	}
	return &endpoints[0]
}

func initActiveEndpoint(endpointService portainer.EndpointService, flags *portainer.CLIFlags) *portainer.Endpoint {
	activeEndpoint, err := endpointService.GetActive()
	if err == portainer.ErrEndpointNotFound {
		if *flags.Endpoint != "" {
			activeEndpoint = &portainer.Endpoint{
				Name:          "primary",
				URL:           *flags.Endpoint,
				TLS:           *flags.TLSVerify,
				TLSCACertPath: *flags.TLSCacert,
				TLSCertPath:   *flags.TLSCert,
				TLSKeyPath:    *flags.TLSKey,
			}
			err = endpointService.CreateEndpoint(activeEndpoint)
			if err != nil {
				log.Fatal(err)
			}
		} else if *flags.ExternalEndpoints != "" {
			activeEndpoint = retrieveFirstEndpointFromDatabase(endpointService)
		}
	} else if err != nil {
		log.Fatal(err)
	}
	return activeEndpoint
}

func main() {
	flags := initCLI()

	fileService := initFileService(*flags.Data)

	store := initStore(*flags.Data)
	defer store.Close()

	jwtService := initJWTService(!*flags.NoAuth)

	cryptoService := initCryptoService()

	authorizeEndpointMgmt := initEndpointWatcher(store.EndpointService, *flags.ExternalEndpoints, *flags.SyncInterval)

	settings := initSettings(authorizeEndpointMgmt, flags)

	activeEndpoint := initActiveEndpoint(store.EndpointService, flags)

	var server portainer.Server = &http.Server{
		BindAddress:        *flags.Addr,
		AssetsPath:         *flags.Assets,
		Settings:           settings,
		TemplatesURL:       *flags.Templates,
		AuthDisabled:       *flags.NoAuth,
		EndpointManagement: authorizeEndpointMgmt,
		UserService:        store.UserService,
		EndpointService:    store.EndpointService,
		CryptoService:      cryptoService,
		JWTService:         jwtService,
		FileService:        fileService,
		ActiveEndpoint:     activeEndpoint,
	}

	log.Printf("Starting Portainer on %s", *flags.Addr)
	err := server.Start()
	if err != nil {
		log.Fatal(err)
	}
}
