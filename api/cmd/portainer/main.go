package main

import (
	"log"
	"os"
	"strings"
	"time"

	cli2 "github.com/portainer/portainer/api/kubernetes/cli"

	"github.com/portainer/portainer/api/kubernetes"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/chisel"

	"github.com/portainer/portainer/api/bolt"
	"github.com/portainer/portainer/api/cli"
	"github.com/portainer/portainer/api/cron"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/exec"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/git"
	"github.com/portainer/portainer/api/http"
	"github.com/portainer/portainer/api/http/client"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/api/ldap"
	"github.com/portainer/portainer/api/libcompose"
)

func initCLI() *portainer.CLIFlags {
	var cliService portainer.CLIService = &cli.Service{}
	flags, err := cliService.ParseFlags(portainer.APIVersion)
	if err != nil {
		log.Fatal(err)
	}

	err = cliService.ValidateFlags(flags)
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

func initDataStore(dataStorePath string, fileService portainer.FileService) portainer.DataStore {
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

func initComposeStackManager(dataStorePath string, reverseTunnelService portainer.ReverseTunnelService) portainer.ComposeStackManager {
	return libcompose.NewComposeStackManager(dataStorePath, reverseTunnelService)
}

func initSwarmStackManager(assetsPath string, dataStorePath string, signatureService portainer.DigitalSignatureService, fileService portainer.FileService, reverseTunnelService portainer.ReverseTunnelService) (portainer.SwarmStackManager, error) {
	return exec.NewSwarmStackManager(assetsPath, dataStorePath, signatureService, fileService, reverseTunnelService)
}

<<<<<<< HEAD
func initKubernetesDeployer(assetsPath string) portainer.KubernetesDeployer {
	return exec.NewKubernetesDeployer(assetsPath)
}

func initJWTService(authenticationEnabled bool) portainer.JWTService {
	if authenticationEnabled {
		jwtService, err := jwt.NewService()
		if err != nil {
			log.Fatal(err)
		}
		return jwtService
=======
func initJWTService(dataStore portainer.DataStore) (portainer.JWTService, error) {
	settings, err := dataStore.Settings().Settings()
	if err != nil {
		return nil, err
>>>>>>> origin/develop
	}

	jwtService, err := jwt.NewService(settings.UserSessionTimeout)
	if err != nil {
		return nil, err
	}
	return jwtService, nil
}

func initDigitalSignatureService() portainer.DigitalSignatureService {
	return crypto.NewECDSAService(os.Getenv("AGENT_SECRET"))
}

func initCryptoService() portainer.CryptoService {
	return &crypto.Service{}
}

func initLDAPService() portainer.LDAPService {
	return &ldap.Service{}
}

func initGitService() portainer.GitService {
	return git.NewService()
}

func initDockerClientFactory(signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService) *docker.ClientFactory {
	return docker.NewClientFactory(signatureService, reverseTunnelService)
}

func initKubernetesClientFactory(signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService) *cli2.ClientFactory {
	return cli2.NewClientFactory(signatureService, reverseTunnelService)
}

func initSnapshotManager(dockerClientFactory *docker.ClientFactory, kubernetesClientFactory *cli2.ClientFactory) *portainer.SnapshotManager {
	dockerSnapshotter := docker.NewSnapshotter(dockerClientFactory)
	kubernetesSnapshotter := kubernetes.NewSnapshotter(kubernetesClientFactory)

	return portainer.NewSnapshotManager(dockerSnapshotter, kubernetesSnapshotter)
}

func initJobScheduler() portainer.JobScheduler {
	return cron.NewJobScheduler()
}

<<<<<<< HEAD
func loadSnapshotSystemSchedule(jobScheduler portainer.JobScheduler, snapshotManager *portainer.SnapshotManager, scheduleService portainer.ScheduleService, endpointService portainer.EndpointService, settingsService portainer.SettingsService) error {
	settings, err := settingsService.Settings()
=======
func loadSnapshotSystemSchedule(jobScheduler portainer.JobScheduler, snapshotter portainer.Snapshotter, dataStore portainer.DataStore) error {
	settings, err := dataStore.Settings().Settings()
>>>>>>> origin/develop
	if err != nil {
		return err
	}

	schedules, err := dataStore.Schedule().SchedulesByJobType(portainer.SnapshotJobType)
	if err != nil {
		return err
	}

	var snapshotSchedule *portainer.Schedule
	if len(schedules) == 0 {
		snapshotJob := &portainer.SnapshotJob{}
		snapshotSchedule = &portainer.Schedule{
			ID:             portainer.ScheduleID(dataStore.Schedule().GetNextIdentifier()),
			Name:           "system_snapshot",
			CronExpression: "@every " + settings.SnapshotInterval,
			Recurring:      true,
			JobType:        portainer.SnapshotJobType,
			SnapshotJob:    snapshotJob,
			Created:        time.Now().Unix(),
		}
	} else {
		snapshotSchedule = &schedules[0]
	}

<<<<<<< HEAD
	snapshotJobContext := cron.NewSnapshotJobContext(endpointService, snapshotManager)
=======
	snapshotJobContext := cron.NewSnapshotJobContext(dataStore, snapshotter)
>>>>>>> origin/develop
	snapshotJobRunner := cron.NewSnapshotJobRunner(snapshotSchedule, snapshotJobContext)

	err = jobScheduler.ScheduleJob(snapshotJobRunner)
	if err != nil {
		return err
	}

	if len(schedules) == 0 {
		return dataStore.Schedule().CreateSchedule(snapshotSchedule)
	}
	return nil
}

func loadSchedulesFromDatabase(jobScheduler portainer.JobScheduler, jobService portainer.JobService, dataStore portainer.DataStore, fileService portainer.FileService, reverseTunnelService portainer.ReverseTunnelService) error {
	schedules, err := dataStore.Schedule().Schedules()
	if err != nil {
		return err
	}

	for _, schedule := range schedules {

		if schedule.JobType == portainer.ScriptExecutionJobType {
			jobContext := cron.NewScriptExecutionJobContext(jobService, dataStore, fileService)
			jobRunner := cron.NewScriptExecutionJobRunner(&schedule, jobContext)

			err = jobScheduler.ScheduleJob(jobRunner)
			if err != nil {
				return err
			}
		}

		if schedule.EdgeSchedule != nil {
			for _, endpointID := range schedule.EdgeSchedule.Endpoints {
				reverseTunnelService.AddSchedule(endpointID, schedule.EdgeSchedule)
			}
		}

	}

	return nil
}

func initStatus(flags *portainer.CLIFlags) *portainer.Status {
	return &portainer.Status{
		Analytics: !*flags.NoAnalytics,
		Version:   portainer.APIVersion,
	}
}

func updateSettingsFromFlags(dataStore portainer.DataStore, flags *portainer.CLIFlags) error {
	settings, err := dataStore.Settings().Settings()
	if err != nil {
		return err
	}

	settings.LogoURL = *flags.Logo
	settings.SnapshotInterval = *flags.SnapshotInterval

	if *flags.Templates != "" {
		settings.TemplatesURL = *flags.Templates
	}

	if *flags.Labels != nil {
		settings.BlackListedLabels = *flags.Labels
	}

	return dataStore.Settings().UpdateSettings(settings)
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

<<<<<<< HEAD
func createTLSSecuredEndpoint(flags *portainer.CLIFlags, endpointService portainer.EndpointService, snapshotManager *portainer.SnapshotManager) error {
=======
func createTLSSecuredEndpoint(flags *portainer.CLIFlags, dataStore portainer.DataStore, snapshotter portainer.Snapshotter) error {
>>>>>>> origin/develop
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

	endpointID := dataStore.Endpoint().GetNextIdentifier()
	endpoint := &portainer.Endpoint{
		ID:                 portainer.EndpointID(endpointID),
		Name:               "primary",
		URL:                *flags.EndpointURL,
		GroupID:            portainer.EndpointGroupID(1),
		Type:               portainer.DockerEnvironment,
		TLSConfig:          tlsConfiguration,
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		Extensions:         []portainer.EndpointExtension{},
		TagIDs:             []portainer.TagID{},
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         portainer.KubernetesDefault(),
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

<<<<<<< HEAD
	err := snapshotManager.SnapshotEndpoint(endpoint)
	if err != nil {
		log.Printf("http error: endpoint snapshot error (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
	}

	return endpointService.CreateEndpoint(endpoint)
}

func createUnsecuredEndpoint(endpointURL string, endpointService portainer.EndpointService, snapshotManager *portainer.SnapshotManager) error {
=======
	return snapshotAndPersistEndpoint(endpoint, dataStore, snapshotter)
}

func createUnsecuredEndpoint(endpointURL string, dataStore portainer.DataStore, snapshotter portainer.Snapshotter) error {
>>>>>>> origin/develop
	if strings.HasPrefix(endpointURL, "tcp://") {
		_, err := client.ExecutePingOperation(endpointURL, nil)
		if err != nil {
			return err
		}
	}

	endpointID := dataStore.Endpoint().GetNextIdentifier()
	endpoint := &portainer.Endpoint{
		ID:                 portainer.EndpointID(endpointID),
		Name:               "primary",
		URL:                endpointURL,
		GroupID:            portainer.EndpointGroupID(1),
		Type:               portainer.DockerEnvironment,
		TLSConfig:          portainer.TLSConfiguration{},
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		Extensions:         []portainer.EndpointExtension{},
		TagIDs:             []portainer.TagID{},
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.DockerSnapshot{},
		Kubernetes:         portainer.KubernetesDefault(),
	}

<<<<<<< HEAD
	err := snapshotManager.SnapshotEndpoint(endpoint)
=======
	return snapshotAndPersistEndpoint(endpoint, dataStore, snapshotter)
}

func snapshotAndPersistEndpoint(endpoint *portainer.Endpoint, dataStore portainer.DataStore, snapshotter portainer.Snapshotter) error {
	snapshot, err := snapshotter.CreateSnapshot(endpoint)
	endpoint.Status = portainer.EndpointStatusUp
>>>>>>> origin/develop
	if err != nil {
		log.Printf("http error: endpoint snapshot error (endpoint=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
	}

<<<<<<< HEAD
	return endpointService.CreateEndpoint(endpoint)
}

func initEndpoint(flags *portainer.CLIFlags, endpointService portainer.EndpointService, snapshotManager *portainer.SnapshotManager) error {
=======
	if snapshot != nil {
		endpoint.Snapshots = []portainer.Snapshot{*snapshot}
	}

	return dataStore.Endpoint().CreateEndpoint(endpoint)
}

func initEndpoint(flags *portainer.CLIFlags, dataStore portainer.DataStore, snapshotter portainer.Snapshotter) error {
>>>>>>> origin/develop
	if *flags.EndpointURL == "" {
		return nil
	}

	endpoints, err := dataStore.Endpoint().Endpoints()
	if err != nil {
		return err
	}

	if len(endpoints) > 0 {
		log.Println("Instance already has defined endpoints. Skipping the endpoint defined via CLI.")
		return nil
	}

	if *flags.TLS || *flags.TLSSkipVerify {
<<<<<<< HEAD
		return createTLSSecuredEndpoint(flags, endpointService, snapshotManager)
	}
	return createUnsecuredEndpoint(*flags.EndpointURL, endpointService, snapshotManager)
=======
		return createTLSSecuredEndpoint(flags, dataStore, snapshotter)
	}
	return createUnsecuredEndpoint(*flags.EndpointURL, dataStore, snapshotter)
>>>>>>> origin/develop
}

func initJobService(dockerClientFactory *docker.ClientFactory) portainer.JobService {
	return docker.NewJobService(dockerClientFactory)
}

func initExtensionManager(fileService portainer.FileService, dataStore portainer.DataStore) (portainer.ExtensionManager, error) {
	extensionManager := exec.NewExtensionManager(fileService, dataStore)

	err := extensionManager.StartExtensions()
	if err != nil {
		return nil, err
	}

	return extensionManager, nil
}

func terminateIfNoAdminCreated(dataStore portainer.DataStore) {
	timer1 := time.NewTimer(5 * time.Minute)
	<-timer1.C

	users, err := dataStore.User().UsersByRole(portainer.AdministratorRole)
	if err != nil {
		log.Fatal(err)
	}

	if len(users) == 0 {
		log.Fatal("No administrator account was created after 5 min. Shutting down the Portainer instance for security reasons.")
		return
	}
}

func main() {
	flags := initCLI()

	fileService := initFileService(*flags.Data)

	dataStore := initDataStore(*flags.Data, fileService)
	defer dataStore.Close()

	jwtService, err := initJWTService(dataStore)
	if err != nil {
		log.Fatal(err)
	}

	ldapService := initLDAPService()

	gitService := initGitService()

	cryptoService := initCryptoService()

	digitalSignatureService := initDigitalSignatureService()

	err = initKeyPair(fileService, digitalSignatureService)
	if err != nil {
		log.Fatal(err)
	}

	extensionManager, err := initExtensionManager(fileService, dataStore)
	if err != nil {
		log.Fatal(err)
	}

	reverseTunnelService := chisel.NewService(dataStore)

	dockerClientFactory := initDockerClientFactory(digitalSignatureService, reverseTunnelService)
	kubernetesClientFactory := initKubernetesClientFactory(digitalSignatureService, reverseTunnelService)

	jobService := initJobService(dockerClientFactory)

	snapshotManager := initSnapshotManager(dockerClientFactory, kubernetesClientFactory)

	swarmStackManager, err := initSwarmStackManager(*flags.Assets, *flags.Data, digitalSignatureService, fileService, reverseTunnelService)
	if err != nil {
		log.Fatal(err)
	}

	composeStackManager := initComposeStackManager(*flags.Data, reverseTunnelService)

<<<<<<< HEAD
	kubernetesDeployer := initKubernetesDeployer(*flags.Assets)

	err = initTemplates(store.TemplateService, fileService, *flags.Templates, *flags.TemplateFile)
	if err != nil {
		log.Fatal(err)
	}

	err = initSettings(store.SettingsService, flags)
	if err != nil {
		log.Fatal(err)
=======
	if dataStore.IsNew() {
		err = updateSettingsFromFlags(dataStore, flags)
		if err != nil {
			log.Fatal(err)
		}
>>>>>>> origin/develop
	}

	jobScheduler := initJobScheduler()

	err = loadSchedulesFromDatabase(jobScheduler, jobService, dataStore, fileService, reverseTunnelService)
	if err != nil {
		log.Fatal(err)
	}

	err = loadSnapshotSystemSchedule(jobScheduler, snapshotter, dataStore)
	if err != nil {
		log.Fatal(err)
	}

<<<<<<< HEAD
	if *flags.Snapshot {
		err = loadSnapshotSystemSchedule(jobScheduler, snapshotManager, store.ScheduleService, store.EndpointService, store.SettingsService)
		if err != nil {
			log.Fatal(err)
		}
	}

=======
>>>>>>> origin/develop
	jobScheduler.Start()

	applicationStatus := initStatus(flags)

<<<<<<< HEAD
	applicationStatus := initStatus(endpointManagement, *flags.Snapshot, flags)

	err = initEndpoint(flags, store.EndpointService, snapshotManager)
=======
	err = initEndpoint(flags, dataStore, snapshotter)
>>>>>>> origin/develop
	if err != nil {
		log.Fatal(err)
	}

	adminPasswordHash := ""
	if *flags.AdminPasswordFile != "" {
		content, err := fileService.GetFileContent(*flags.AdminPasswordFile)
		if err != nil {
			log.Fatal(err)
		}
		adminPasswordHash, err = cryptoService.Hash(strings.TrimSuffix(string(content), "\n"))
		if err != nil {
			log.Fatal(err)
		}
	} else if *flags.AdminPassword != "" {
		adminPasswordHash = *flags.AdminPassword
	}

	if adminPasswordHash != "" {
		users, err := dataStore.User().UsersByRole(portainer.AdministratorRole)
		if err != nil {
			log.Fatal(err)
		}

		if len(users) == 0 {
			log.Println("Created admin user with the given password.")
			user := &portainer.User{
				Username:                "admin",
				Role:                    portainer.AdministratorRole,
				Password:                adminPasswordHash,
				PortainerAuthorizations: portainer.DefaultPortainerAuthorizations(),
			}
			err := dataStore.User().CreateUser(user)
			if err != nil {
				log.Fatal(err)
			}
		} else {
			log.Println("Instance already has an administrator user defined. Skipping admin password related flags.")
		}
	}

	go terminateIfNoAdminCreated(dataStore)

	err = reverseTunnelService.StartTunnelServer(*flags.TunnelAddr, *flags.TunnelPort, snapshotManager)
	if err != nil {
		log.Fatal(err)
	}

	var server portainer.Server = &http.Server{
<<<<<<< HEAD
		ReverseTunnelService:    reverseTunnelService,
		Status:                  applicationStatus,
		BindAddress:             *flags.Addr,
		AssetsPath:              *flags.Assets,
		AuthDisabled:            *flags.NoAuth,
		EndpointManagement:      endpointManagement,
		RoleService:             store.RoleService,
		UserService:             store.UserService,
		TeamService:             store.TeamService,
		TeamMembershipService:   store.TeamMembershipService,
		EndpointService:         store.EndpointService,
		EndpointGroupService:    store.EndpointGroupService,
		ExtensionService:        store.ExtensionService,
		ResourceControlService:  store.ResourceControlService,
		SettingsService:         store.SettingsService,
		RegistryService:         store.RegistryService,
		DockerHubService:        store.DockerHubService,
		StackService:            store.StackService,
		ScheduleService:         store.ScheduleService,
		TagService:              store.TagService,
		TemplateService:         store.TemplateService,
		WebhookService:          store.WebhookService,
		SwarmStackManager:       swarmStackManager,
		ComposeStackManager:     composeStackManager,
		KubernetesDeployer:      kubernetesDeployer,
		ExtensionManager:        extensionManager,
		CryptoService:           cryptoService,
		JWTService:              jwtService,
		FileService:             fileService,
		LDAPService:             ldapService,
		GitService:              gitService,
		SignatureService:        digitalSignatureService,
		JobScheduler:            jobScheduler,
		SnapshotManager:         snapshotManager,
		SSL:                     *flags.SSL,
		SSLCert:                 *flags.SSLCert,
		SSLKey:                  *flags.SSLKey,
		DockerClientFactory:     dockerClientFactory,
		KubernetesClientFactory: kubernetesClientFactory,
		JobService:              jobService,
=======
		ReverseTunnelService: reverseTunnelService,
		Status:               applicationStatus,
		BindAddress:          *flags.Addr,
		AssetsPath:           *flags.Assets,
		DataStore:            dataStore,
		SwarmStackManager:    swarmStackManager,
		ComposeStackManager:  composeStackManager,
		ExtensionManager:     extensionManager,
		CryptoService:        cryptoService,
		JWTService:           jwtService,
		FileService:          fileService,
		LDAPService:          ldapService,
		GitService:           gitService,
		SignatureService:     digitalSignatureService,
		JobScheduler:         jobScheduler,
		Snapshotter:          snapshotter,
		SSL:                  *flags.SSL,
		SSLCert:              *flags.SSLCert,
		SSLKey:               *flags.SSLKey,
		DockerClientFactory:  clientFactory,
		JobService:           jobService,
>>>>>>> origin/develop
	}

	log.Printf("Starting Portainer %s on %s", portainer.APIVersion, *flags.Addr)
	err = server.Start()
	if err != nil {
		log.Fatal(err)
	}
}
