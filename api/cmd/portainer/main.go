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
	store, err := bolt.NewStore(dataStorePath)
	if err != nil {
		log.Fatal(err)
	}

	err = store.Open()
	if err != nil {
		log.Fatal(err)
	}

	err = store.MigrateData()
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
		Analytics:          !*flags.NoAnalytics,
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

func main() {
	flags := initCLI()

	fileService := initFileService(*flags.Data)

	store := initStore(*flags.Data)
	defer store.Close()

	jwtService := initJWTService(!*flags.NoAuth)

	cryptoService := initCryptoService()

	authorizeEndpointMgmt := initEndpointWatcher(store.EndpointService, *flags.ExternalEndpoints, *flags.SyncInterval)

	settings := initSettings(authorizeEndpointMgmt, flags)

	if *flags.Endpoint != "" {
		var endpoints []portainer.Endpoint
		endpoints, err := store.EndpointService.Endpoints()
		if err != nil {
			log.Fatal(err)
		}
		if len(endpoints) == 0 {
			endpoint := &portainer.Endpoint{
				Name:            "primary",
				URL:             *flags.Endpoint,
				TLS:             *flags.TLSVerify,
				TLSCACertPath:   *flags.TLSCacert,
				TLSCertPath:     *flags.TLSCert,
				TLSKeyPath:      *flags.TLSKey,
				AuthorizedUsers: []portainer.UserID{},
				AuthorizedTeams: []portainer.TeamID{},
			}
			err = store.EndpointService.CreateEndpoint(endpoint)
			if err != nil {
				log.Fatal(err)
			}
		} else {
			log.Println("Instance already has defined endpoints. Skipping the endpoint defined via CLI.")
		}
	}

	if *flags.AdminPassword != "" {
		log.Printf("Creating admin user with password hash %s", *flags.AdminPassword)
		user := &portainer.User{
			Username: "admin",
			Role:     portainer.AdministratorRole,
			Password: *flags.AdminPassword,
		}
		err := store.UserService.CreateUser(user)
		if err != nil {
			log.Fatal(err)
		}
	}

	var server portainer.Server = &http.Server{
		BindAddress:            *flags.Addr,
		AssetsPath:             *flags.Assets,
		Settings:               settings,
		TemplatesURL:           *flags.Templates,
		AuthDisabled:           *flags.NoAuth,
		EndpointManagement:     authorizeEndpointMgmt,
		UserService:            store.UserService,
		TeamService:            store.TeamService,
		EndpointService:        store.EndpointService,
		ResourceControlService: store.ResourceControlService,
		CryptoService:          cryptoService,
		JWTService:             jwtService,
		FileService:            fileService,
	}

	log.Printf("Starting Portainer on %s", *flags.Addr)
	err := server.Start()
	if err != nil {
		log.Fatal(err)
	}
}
