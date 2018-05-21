package main // import "github.com/portainer/portainer"

import (
	"strings"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt"
	"github.com/portainer/portainer/cli"
	"github.com/portainer/portainer/cron"
	"github.com/portainer/portainer/crypto"
	"github.com/portainer/portainer/exec"
	"github.com/portainer/portainer/filesystem"
	"github.com/portainer/portainer/git"
	"github.com/portainer/portainer/http"
	"github.com/portainer/portainer/http/client"
	"github.com/portainer/portainer/jwt"
	"github.com/portainer/portainer/ldap"

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
	fileService, err := filesystem.NewService(dataStorePath, "")
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

	err = store.Init()
	if err != nil {
		log.Fatal(err)
	}

	err = store.MigrateData()
	if err != nil {
		log.Fatal(err)
	}
	return store
}

func initDemoData(store *bolt.Store, cryptoService portainer.CryptoService) error {
	password, err := cryptoService.Hash("tryportainer")
	if err != nil {
		return err
	}

	admin := &portainer.User{
		Username: "admin",
		Password: password,
		Role:     portainer.AdministratorRole,
	}

	err = store.UserService.CreateUser(admin)
	if err != nil {
		return err
	}

	localEndpoint := &portainer.Endpoint{
		Name:      "local",
		URL:       "unix:///var/run/docker.sock",
		PublicURL: "demo.portainer.io",
		TLSConfig: portainer.TLSConfiguration{
			TLS: false,
		},
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Extensions:      []portainer.EndpointExtension{},
	}

	err = store.EndpointService.CreateEndpoint(localEndpoint)
	if err != nil {
		return err
	}

	return nil
}

func initStackManager(assetsPath string, dataStorePath string, signatureService portainer.DigitalSignatureService, fileService portainer.FileService) (portainer.StackManager, error) {
	return exec.NewStackManager(assetsPath, dataStorePath, signatureService, fileService)
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

func initDigitalSignatureService() portainer.DigitalSignatureService {
	return &crypto.ECDSAService{}
}

func initCryptoService() portainer.CryptoService {
	return &crypto.Service{}
}

func initLDAPService() portainer.LDAPService {
	return &ldap.Service{}
}

func initGitService() portainer.GitService {
	return &git.Service{}
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

func initStatus(authorizeEndpointMgmt bool, flags *portainer.CLIFlags) *portainer.Status {
	return &portainer.Status{
		Analytics:          !*flags.NoAnalytics,
		Authentication:     !*flags.NoAuth,
		EndpointManagement: authorizeEndpointMgmt,
		Version:            portainer.APIVersion,
	}
}

func initDockerHub(dockerHubService portainer.DockerHubService) error {
	_, err := dockerHubService.DockerHub()
	if err == portainer.ErrDockerHubNotFound {
		dockerhub := &portainer.DockerHub{
			Authentication: false,
			Username:       "",
			Password:       "",
		}
		return dockerHubService.StoreDockerHub(dockerhub)
	} else if err != nil {
		return err
	}

	return nil
}

func initSettings(settingsService portainer.SettingsService, flags *portainer.CLIFlags) error {
	_, err := settingsService.Settings()
	if err == portainer.ErrSettingsNotFound {
		settings := &portainer.Settings{
			LogoURL:                     *flags.Logo,
			DisplayDonationHeader:       true,
			DisplayExternalContributors: false,
			AuthenticationMethod:        portainer.AuthenticationInternal,
			LDAPSettings: portainer.LDAPSettings{
				TLSConfig: portainer.TLSConfiguration{},
				SearchSettings: []portainer.LDAPSearchSettings{
					portainer.LDAPSearchSettings{},
				},
			},
			AllowBindMountsForRegularUsers:     true,
			AllowPrivilegedModeForRegularUsers: true,
		}

		if *flags.Templates != "" {
			settings.TemplatesURL = *flags.Templates
		} else {
			settings.TemplatesURL = portainer.DefaultTemplatesURL
		}

		if *flags.Labels != nil {
			settings.BlackListedLabels = *flags.Labels
		} else {
			settings.BlackListedLabels = make([]portainer.Pair, 0)
		}

		return settingsService.StoreSettings(settings)
	} else if err != nil {
		return err
	}

	return nil
}

func retrieveFirstEndpointFromDatabase(endpointService portainer.EndpointService) *portainer.Endpoint {
	endpoints, err := endpointService.Endpoints()
	if err != nil {
		log.Fatal(err)
	}
	return &endpoints[0]
}

func loadAndParseKeyPair(fileService portainer.FileService, signatureService portainer.DigitalSignatureService) error {
	private, public, err := fileService.LoadKeyPair()
	if err != nil {
		return err
	}
	return signatureService.ParseKeyPair(private, public)
}

func generateAndStoreKeyPair(fileService portainer.FileService, signatureService portainer.DigitalSignatureService) error {
	private, public, err := signatureService.GenerateKeyPair()
	if err != nil {
		return err
	}
	privateHeader, publicHeader := signatureService.PEMHeaders()
	return fileService.StoreKeyPair(private, public, privateHeader, publicHeader)
}

func initKeyPair(fileService portainer.FileService, signatureService portainer.DigitalSignatureService) error {
	existingKeyPair, err := fileService.KeyPairFilesExist()
	if err != nil {
		log.Fatal(err)
	}

	if existingKeyPair {
		return loadAndParseKeyPair(fileService, signatureService)
	}
	return generateAndStoreKeyPair(fileService, signatureService)
}

func createTLSSecuredEndpoint(flags *portainer.CLIFlags, endpointService portainer.EndpointService) error {
	tlsConfiguration := portainer.TLSConfiguration{
		TLS:           *flags.TLS,
		TLSSkipVerify: *flags.TLSSkipVerify,
	}

	if *flags.TLS {
		tlsConfiguration.TLSCACertPath = *flags.TLSCacert
		tlsConfiguration.TLSCertPath = *flags.TLSCert
		tlsConfiguration.TLSKeyPath = *flags.TLSKey
	} else if !*flags.TLS && *flags.TLSSkipVerify {
		tlsConfiguration.TLS = true
	}

	endpoint := &portainer.Endpoint{
		Name:            "primary",
		URL:             *flags.EndpointURL,
		GroupID:         portainer.EndpointGroupID(1),
		Type:            portainer.DockerEnvironment,
		TLSConfig:       tlsConfiguration,
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Extensions:      []portainer.EndpointExtension{},
	}

	if strings.HasPrefix(endpoint.URL, "tcp://") {
		tlsConfig, err := crypto.CreateTLSConfigurationFromDisk(tlsConfiguration.TLSCACertPath, tlsConfiguration.TLSCertPath, tlsConfiguration.TLSKeyPath, tlsConfiguration.TLSSkipVerify)
		if err != nil {
			return err
		}

		agentOnDockerEnvironment, err := client.ExecutePingOperation(endpoint.URL, tlsConfig)
		if err != nil {
			return err
		}

		if agentOnDockerEnvironment {
			endpoint.Type = portainer.AgentOnDockerEnvironment
		}
	}

	return endpointService.CreateEndpoint(endpoint)
}

func createUnsecuredEndpoint(endpointURL string, endpointService portainer.EndpointService) error {
	if strings.HasPrefix(endpointURL, "tcp://") {
		_, err := client.ExecutePingOperation(endpointURL, nil)
		if err != nil {
			return err
		}
	}

	endpoint := &portainer.Endpoint{
		Name:            "primary",
		URL:             endpointURL,
		GroupID:         portainer.EndpointGroupID(1),
		Type:            portainer.DockerEnvironment,
		TLSConfig:       portainer.TLSConfiguration{},
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Extensions:      []portainer.EndpointExtension{},
	}

	return endpointService.CreateEndpoint(endpoint)
}

func initEndpoint(flags *portainer.CLIFlags, endpointService portainer.EndpointService) error {
	if *flags.EndpointURL == "" {
		return nil
	}

	endpoints, err := endpointService.Endpoints()
	if err != nil {
		return err
	}

	if len(endpoints) > 0 {
		log.Println("Instance already has defined endpoints. Skipping the endpoint defined via CLI.")
		return nil
	}

	if *flags.TLS || *flags.TLSSkipVerify {
		return createTLSSecuredEndpoint(flags, endpointService)
	}
	return createUnsecuredEndpoint(*flags.EndpointURL, endpointService)
}

func main() {
	flags := initCLI()

	fileService := initFileService(*flags.Data)

	store := initStore(*flags.Data)
	defer store.Close()

	jwtService := initJWTService(!*flags.NoAuth)

	cryptoService := initCryptoService()

	initDemoData(store, cryptoService)

	digitalSignatureService := initDigitalSignatureService()

	ldapService := initLDAPService()

	gitService := initGitService()

	authorizeEndpointMgmt := initEndpointWatcher(store.EndpointService, *flags.ExternalEndpoints, *flags.SyncInterval)

	err := initKeyPair(fileService, digitalSignatureService)
	if err != nil {
		log.Fatal(err)
	}

	stackManager, err := initStackManager(*flags.Assets, *flags.Data, digitalSignatureService, fileService)
	if err != nil {
		log.Fatal(err)
	}

	err = initSettings(store.SettingsService, flags)
	if err != nil {
		log.Fatal(err)
	}

	err = initDockerHub(store.DockerHubService)
	if err != nil {
		log.Fatal(err)
	}

	applicationStatus := initStatus(authorizeEndpointMgmt, flags)

	err = initEndpoint(flags, store.EndpointService)
	if err != nil {
		log.Fatal(err)
	}

	adminPasswordHash := ""
	if *flags.AdminPasswordFile != "" {
		content, err := fileService.GetFileContent(*flags.AdminPasswordFile)
		if err != nil {
			log.Fatal(err)
		}
		adminPasswordHash, err = cryptoService.Hash(content)
		if err != nil {
			log.Fatal(err)
		}
	} else if *flags.AdminPassword != "" {
		adminPasswordHash = *flags.AdminPassword
	}

	if adminPasswordHash != "" {
		users, err := store.UserService.UsersByRole(portainer.AdministratorRole)
		if err != nil {
			log.Fatal(err)
		}

		if len(users) == 0 {
			log.Printf("Creating admin user with password hash %s", adminPasswordHash)
			user := &portainer.User{
				Username: "admin",
				Role:     portainer.AdministratorRole,
				Password: adminPasswordHash,
			}
			err := store.UserService.CreateUser(user)
			if err != nil {
				log.Fatal(err)
			}
		} else {
			log.Println("Instance already has an administrator user defined. Skipping admin password related flags.")
		}
	}

	var server portainer.Server = &http.Server{
		Status:                 applicationStatus,
		BindAddress:            *flags.Addr,
		AssetsPath:             *flags.Assets,
		AuthDisabled:           *flags.NoAuth,
		EndpointManagement:     authorizeEndpointMgmt,
		UserService:            store.UserService,
		TeamService:            store.TeamService,
		TeamMembershipService:  store.TeamMembershipService,
		EndpointService:        store.EndpointService,
		EndpointGroupService:   store.EndpointGroupService,
		ResourceControlService: store.ResourceControlService,
		SettingsService:        store.SettingsService,
		RegistryService:        store.RegistryService,
		DockerHubService:       store.DockerHubService,
		StackService:           store.StackService,
		StackManager:           stackManager,
		CryptoService:          cryptoService,
		JWTService:             jwtService,
		FileService:            fileService,
		LDAPService:            ldapService,
		GitService:             gitService,
		SignatureService:       digitalSignatureService,
		SSL:                    *flags.SSL,
		SSLCert:                *flags.SSLCert,
		SSLKey:                 *flags.SSLKey,
	}

	log.Printf("Starting Portainer %s on %s", portainer.APIVersion, *flags.Addr)
	err = server.Start()
	if err != nil {
		log.Fatal(err)
	}
}
