package main // import "github.com/portainer/portainer"

import (
	"encoding/json"
	"strings"

	"github.com/portainer/portainer"
	"github.com/portainer/portainer/bolt"
	"github.com/portainer/portainer/cli"
	"github.com/portainer/portainer/cron"
	"github.com/portainer/portainer/crypto"
	"github.com/portainer/portainer/docker"
	"github.com/portainer/portainer/exec"
	"github.com/portainer/portainer/filesystem"
	"github.com/portainer/portainer/git"
	"github.com/portainer/portainer/http"
	"github.com/portainer/portainer/http/client"
	"github.com/portainer/portainer/jwt"
	"github.com/portainer/portainer/ldap"
	"github.com/portainer/portainer/libcompose"

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

func initStore(dataStorePath string, fileService portainer.FileService) *bolt.Store {
	store, err := bolt.NewStore(dataStorePath, fileService)
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

func initComposeStackManager(dataStorePath string) portainer.ComposeStackManager {
	return libcompose.NewComposeStackManager(dataStorePath)
}

func initSwarmStackManager(assetsPath string, dataStorePath string, signatureService portainer.DigitalSignatureService, fileService portainer.FileService) (portainer.SwarmStackManager, error) {
	return exec.NewSwarmStackManager(assetsPath, dataStorePath, signatureService, fileService)
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

func initClientFactory(signatureService portainer.DigitalSignatureService) *docker.ClientFactory {
	return docker.NewClientFactory(signatureService)
}

func initSnapshotter(clientFactory *docker.ClientFactory) portainer.Snapshotter {
	return docker.NewSnapshotter(clientFactory)
}

func initJobScheduler(endpointService portainer.EndpointService, snapshotter portainer.Snapshotter, flags *portainer.CLIFlags) (portainer.JobScheduler, error) {
	jobScheduler := cron.NewJobScheduler(endpointService, snapshotter)

	if *flags.ExternalEndpoints != "" {
		log.Println("Using external endpoint definition. Endpoint management via the API will be disabled.")
		err := jobScheduler.ScheduleEndpointSyncJob(*flags.ExternalEndpoints, *flags.SyncInterval)
		if err != nil {
			return nil, err
		}
	}

	if *flags.Snapshot {
		err := jobScheduler.ScheduleSnapshotJob(*flags.SnapshotInterval)
		if err != nil {
			return nil, err
		}
	}

	return jobScheduler, nil
}

func initStatus(endpointManagement, snapshot bool, flags *portainer.CLIFlags) *portainer.Status {
	return &portainer.Status{
		Analytics:          !*flags.NoAnalytics,
		Authentication:     !*flags.NoAuth,
		EndpointManagement: endpointManagement,
		Snapshot:           snapshot,
		Version:            portainer.APIVersion,
	}
}

func initDockerHub(dockerHubService portainer.DockerHubService) error {
	_, err := dockerHubService.DockerHub()
	if err == portainer.ErrObjectNotFound {
		dockerhub := &portainer.DockerHub{
			Authentication: false,
			Username:       "",
			Password:       "",
		}
		return dockerHubService.UpdateDockerHub(dockerhub)
	} else if err != nil {
		return err
	}

	return nil
}

func initSettings(settingsService portainer.SettingsService, flags *portainer.CLIFlags) error {
	_, err := settingsService.Settings()
	if err == portainer.ErrObjectNotFound {
		settings := &portainer.Settings{
			LogoURL:              *flags.Logo,
			AuthenticationMethod: portainer.AuthenticationInternal,
			LDAPSettings: portainer.LDAPSettings{
				AutoCreateUsers: true,
				TLSConfig:       portainer.TLSConfiguration{},
				SearchSettings: []portainer.LDAPSearchSettings{
					portainer.LDAPSearchSettings{},
				},
				GroupSearchSettings: []portainer.LDAPGroupSearchSettings{
					portainer.LDAPGroupSearchSettings{},
				},
			},
			AllowBindMountsForRegularUsers:     true,
			AllowPrivilegedModeForRegularUsers: true,
			SnapshotInterval:                   *flags.SnapshotInterval,
		}

		if *flags.Templates != "" {
			settings.TemplatesURL = *flags.Templates
		}

		if *flags.Labels != nil {
			settings.BlackListedLabels = *flags.Labels
		} else {
			settings.BlackListedLabels = make([]portainer.Pair, 0)
		}

		return settingsService.UpdateSettings(settings)
	} else if err != nil {
		return err
	}

	return nil
}

func initTemplates(templateService portainer.TemplateService, fileService portainer.FileService, templateURL, templateFile string) error {
	if templateURL != "" {
		log.Printf("Portainer started with the --templates flag. Using external templates, template management will be disabled.")
		return nil
	}

	existingTemplates, err := templateService.Templates()
	if err != nil {
		return err
	}

	if len(existingTemplates) != 0 {
		log.Printf("Templates already registered inside the database. Skipping template import.")
		return nil
	}

	templatesJSON, err := fileService.GetFileContent(templateFile)
	if err != nil {
		log.Println("Unable to retrieve template definitions via filesystem")
		return err
	}

	var templates []portainer.Template
	err = json.Unmarshal(templatesJSON, &templates)
	if err != nil {
		log.Println("Unable to parse templates file. Please review your template definition file.")
		return err
	}

	for _, template := range templates {
		err := templateService.CreateTemplate(&template)
		if err != nil {
			return err
		}
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

func createTLSSecuredEndpoint(flags *portainer.CLIFlags, endpointService portainer.EndpointService, snapshotter portainer.Snapshotter) error {
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

	endpointID := endpointService.GetNextIdentifier()
	endpoint := &portainer.Endpoint{
		ID:              portainer.EndpointID(endpointID),
		Name:            "primary",
		URL:             *flags.EndpointURL,
		GroupID:         portainer.EndpointGroupID(1),
		Type:            portainer.DockerEnvironment,
		TLSConfig:       tlsConfiguration,
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Extensions:      []portainer.EndpointExtension{},
		Tags:            []string{},
		Status:          portainer.EndpointStatusUp,
		Snapshots:       []portainer.Snapshot{},
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

	return snapshotAndPersistEndpoint(endpoint, endpointService, snapshotter)
}

func createUnsecuredEndpoint(endpointURL string, endpointService portainer.EndpointService, snapshotter portainer.Snapshotter) error {
	if strings.HasPrefix(endpointURL, "tcp://") {
		_, err := client.ExecutePingOperation(endpointURL, nil)
		if err != nil {
			return err
		}
	}

	endpointID := endpointService.GetNextIdentifier()
	endpoint := &portainer.Endpoint{
		ID:              portainer.EndpointID(endpointID),
		Name:            "primary",
		URL:             endpointURL,
		GroupID:         portainer.EndpointGroupID(1),
		Type:            portainer.DockerEnvironment,
		TLSConfig:       portainer.TLSConfiguration{},
		AuthorizedUsers: []portainer.UserID{},
		AuthorizedTeams: []portainer.TeamID{},
		Extensions:      []portainer.EndpointExtension{},
		Tags:            []string{},
		Status:          portainer.EndpointStatusUp,
		Snapshots:       []portainer.Snapshot{},
	}

	return snapshotAndPersistEndpoint(endpoint, endpointService, snapshotter)
}

func snapshotAndPersistEndpoint(endpoint *portainer.Endpoint, endpointService portainer.EndpointService, snapshotter portainer.Snapshotter) error {
	snapshot, err := snapshotter.CreateSnapshot(endpoint)
	endpoint.Status = portainer.EndpointStatusUp
	if err != nil {
		log.Printf("http error: endpoint snapshot error (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
	}

	if snapshot != nil {
		endpoint.Snapshots = []portainer.Snapshot{*snapshot}
	}

	return endpointService.CreateEndpoint(endpoint)
}

func initEndpoint(flags *portainer.CLIFlags, endpointService portainer.EndpointService, snapshotter portainer.Snapshotter) error {
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
		return createTLSSecuredEndpoint(flags, endpointService, snapshotter)
	}
	return createUnsecuredEndpoint(*flags.EndpointURL, endpointService, snapshotter)
}

func initJobService(dockerClientFactory *docker.ClientFactory) portainer.JobService {
	return docker.NewJobService(dockerClientFactory)
}

func main() {
	flags := initCLI()

	fileService := initFileService(*flags.Data)

	store := initStore(*flags.Data, fileService)
	defer store.Close()

	jwtService := initJWTService(!*flags.NoAuth)

	ldapService := initLDAPService()

	gitService := initGitService()

	cryptoService := initCryptoService()

	digitalSignatureService := initDigitalSignatureService()

	err := initKeyPair(fileService, digitalSignatureService)
	if err != nil {
		log.Fatal(err)
	}

	clientFactory := initClientFactory(digitalSignatureService)

	jobService := initJobService(clientFactory)

	snapshotter := initSnapshotter(clientFactory)

	jobScheduler, err := initJobScheduler(store.EndpointService, snapshotter, flags)
	if err != nil {
		log.Fatal(err)
	}

	jobScheduler.Start()

	endpointManagement := true
	if *flags.ExternalEndpoints != "" {
		endpointManagement = false
	}

	swarmStackManager, err := initSwarmStackManager(*flags.Assets, *flags.Data, digitalSignatureService, fileService)
	if err != nil {
		log.Fatal(err)
	}

	composeStackManager := initComposeStackManager(*flags.Data)

	err = initTemplates(store.TemplateService, fileService, *flags.Templates, *flags.TemplateFile)
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

	applicationStatus := initStatus(endpointManagement, *flags.Snapshot, flags)

	err = initEndpoint(flags, store.EndpointService, snapshotter)
	if err != nil {
		log.Fatal(err)
	}

	adminPasswordHash := ""
	if *flags.AdminPasswordFile != "" {
		content, err := fileService.GetFileContent(*flags.AdminPasswordFile)
		if err != nil {
			log.Fatal(err)
		}
		adminPasswordHash, err = cryptoService.Hash(string(content))
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
		EndpointManagement:     endpointManagement,
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
		TagService:             store.TagService,
		TemplateService:        store.TemplateService,
		WebhookService:         store.WebhookService,
		SwarmStackManager:      swarmStackManager,
		ComposeStackManager:    composeStackManager,
		CryptoService:          cryptoService,
		JWTService:             jwtService,
		FileService:            fileService,
		LDAPService:            ldapService,
		GitService:             gitService,
		SignatureService:       digitalSignatureService,
		JobScheduler:           jobScheduler,
		Snapshotter:            snapshotter,
		SSL:                    *flags.SSL,
		SSLCert:                *flags.SSLCert,
		SSLKey:                 *flags.SSLKey,
		DockerClientFactory:    clientFactory,
		JobService:             jobService,
	}

	log.Printf("Starting Portainer %s on %s", portainer.APIVersion, *flags.Addr)
	err = server.Start()
	if err != nil {
		log.Fatal(err)
	}
}
