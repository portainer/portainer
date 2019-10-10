package main

import (
	"encoding/json"
	"log"
	"os"
	"strings"
	"time"

	"github.com/portainer/portainer/api/chisel"

	"github.com/portainer/portainer/api"
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

func initComposeStackManager(dataStorePath string, reverseTunnelService portainer.ReverseTunnelService) portainer.ComposeStackManager {
	return libcompose.NewComposeStackManager(dataStorePath, reverseTunnelService)
}

func initSwarmStackManager(assetsPath string, dataStorePath string, signatureService portainer.DigitalSignatureService, fileService portainer.FileService, reverseTunnelService portainer.ReverseTunnelService) (portainer.SwarmStackManager, error) {
	return exec.NewSwarmStackManager(assetsPath, dataStorePath, signatureService, fileService, reverseTunnelService)
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

func initClientFactory(signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService) *docker.ClientFactory {
	return docker.NewClientFactory(signatureService, reverseTunnelService)
}

func initSnapshotter(clientFactory *docker.ClientFactory) portainer.Snapshotter {
	return docker.NewSnapshotter(clientFactory)
}

func initJobScheduler() portainer.JobScheduler {
	return cron.NewJobScheduler()
}

func loadSnapshotSystemSchedule(jobScheduler portainer.JobScheduler, snapshotter portainer.Snapshotter, scheduleService portainer.ScheduleService, endpointService portainer.EndpointService, settingsService portainer.SettingsService) error {
	settings, err := settingsService.Settings()
	if err != nil {
		return err
	}

	schedules, err := scheduleService.SchedulesByJobType(portainer.SnapshotJobType)
	if err != nil {
		return err
	}

	var snapshotSchedule *portainer.Schedule
	if len(schedules) == 0 {
		snapshotJob := &portainer.SnapshotJob{}
		snapshotSchedule = &portainer.Schedule{
			ID:             portainer.ScheduleID(scheduleService.GetNextIdentifier()),
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

	snapshotJobContext := cron.NewSnapshotJobContext(endpointService, snapshotter)
	snapshotJobRunner := cron.NewSnapshotJobRunner(snapshotSchedule, snapshotJobContext)

	err = jobScheduler.ScheduleJob(snapshotJobRunner)
	if err != nil {
		return err
	}

	if len(schedules) == 0 {
		return scheduleService.CreateSchedule(snapshotSchedule)
	}
	return nil
}

func loadEndpointSyncSystemSchedule(jobScheduler portainer.JobScheduler, scheduleService portainer.ScheduleService, endpointService portainer.EndpointService, flags *portainer.CLIFlags) error {
	if *flags.ExternalEndpoints == "" {
		return nil
	}

	log.Println("Using external endpoint definition. Endpoint management via the API will be disabled.")

	schedules, err := scheduleService.SchedulesByJobType(portainer.EndpointSyncJobType)
	if err != nil {
		return err
	}

	if len(schedules) != 0 {
		return nil
	}

	endpointSyncJob := &portainer.EndpointSyncJob{}

	endpointSyncSchedule := &portainer.Schedule{
		ID:              portainer.ScheduleID(scheduleService.GetNextIdentifier()),
		Name:            "system_endpointsync",
		CronExpression:  "@every " + *flags.SyncInterval,
		Recurring:       true,
		JobType:         portainer.EndpointSyncJobType,
		EndpointSyncJob: endpointSyncJob,
		Created:         time.Now().Unix(),
	}

	endpointSyncJobContext := cron.NewEndpointSyncJobContext(endpointService, *flags.ExternalEndpoints)
	endpointSyncJobRunner := cron.NewEndpointSyncJobRunner(endpointSyncSchedule, endpointSyncJobContext)

	err = jobScheduler.ScheduleJob(endpointSyncJobRunner)
	if err != nil {
		return err
	}

	return scheduleService.CreateSchedule(endpointSyncSchedule)
}

func loadSchedulesFromDatabase(jobScheduler portainer.JobScheduler, jobService portainer.JobService, scheduleService portainer.ScheduleService, endpointService portainer.EndpointService, fileService portainer.FileService, reverseTunnelService portainer.ReverseTunnelService) error {
	schedules, err := scheduleService.Schedules()
	if err != nil {
		return err
	}

	for _, schedule := range schedules {

		if schedule.JobType == portainer.ScriptExecutionJobType {
			jobContext := cron.NewScriptExecutionJobContext(jobService, endpointService, fileService)
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
			OAuthSettings:                      portainer.OAuthSettings{},
			AllowBindMountsForRegularUsers:     true,
			AllowPrivilegedModeForRegularUsers: true,
			AllowVolumeBrowserForRegularUsers:  false,
			EnableHostManagementFeatures:       false,
			SnapshotInterval:                   *flags.SnapshotInterval,
			EdgeAgentCheckinInterval:           portainer.DefaultEdgeAgentCheckinIntervalInSeconds,
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
		ID:                 portainer.EndpointID(endpointID),
		Name:               "primary",
		URL:                *flags.EndpointURL,
		GroupID:            portainer.EndpointGroupID(1),
		Type:               portainer.DockerEnvironment,
		TLSConfig:          tlsConfiguration,
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		Extensions:         []portainer.EndpointExtension{},
		Tags:               []string{},
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.Snapshot{},
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
		ID:                 portainer.EndpointID(endpointID),
		Name:               "primary",
		URL:                endpointURL,
		GroupID:            portainer.EndpointGroupID(1),
		Type:               portainer.DockerEnvironment,
		TLSConfig:          portainer.TLSConfiguration{},
		UserAccessPolicies: portainer.UserAccessPolicies{},
		TeamAccessPolicies: portainer.TeamAccessPolicies{},
		Extensions:         []portainer.EndpointExtension{},
		Tags:               []string{},
		Status:             portainer.EndpointStatusUp,
		Snapshots:          []portainer.Snapshot{},
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

func initExtensionManager(fileService portainer.FileService, extensionService portainer.ExtensionService) (portainer.ExtensionManager, error) {
	extensionManager := exec.NewExtensionManager(fileService, extensionService)

	extensions, err := extensionService.Extensions()
	if err != nil {
		return nil, err
	}

	for _, extension := range extensions {
		err := extensionManager.EnableExtension(&extension, extension.License.LicenseKey)
		if err != nil {
			log.Printf("Unable to enable extension: %s [extension: %s]", err.Error(), extension.Name)
			extension.Enabled = false
			extension.License.Valid = false
		}

		err = extensionService.Persist(&extension)
		if err != nil {
			return nil, err
		}

	}

	return extensionManager, nil
}

func terminateIfNoAdminCreated(userService portainer.UserService) {
	timer1 := time.NewTimer(5 * time.Minute)
	<-timer1.C

	users, err := userService.UsersByRole(portainer.AdministratorRole)
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

	extensionManager, err := initExtensionManager(fileService, store.ExtensionService)
	if err != nil {
		log.Fatal(err)
	}

	reverseTunnelService := chisel.NewService(store.EndpointService, store.TunnelServerService)

	clientFactory := initClientFactory(digitalSignatureService, reverseTunnelService)

	jobService := initJobService(clientFactory)

	snapshotter := initSnapshotter(clientFactory)

	endpointManagement := true
	if *flags.ExternalEndpoints != "" {
		endpointManagement = false
	}

	swarmStackManager, err := initSwarmStackManager(*flags.Assets, *flags.Data, digitalSignatureService, fileService, reverseTunnelService)
	if err != nil {
		log.Fatal(err)
	}

	composeStackManager := initComposeStackManager(*flags.Data, reverseTunnelService)

	err = initTemplates(store.TemplateService, fileService, *flags.Templates, *flags.TemplateFile)
	if err != nil {
		log.Fatal(err)
	}

	err = initSettings(store.SettingsService, flags)
	if err != nil {
		log.Fatal(err)
	}

	jobScheduler := initJobScheduler()

	err = loadSchedulesFromDatabase(jobScheduler, jobService, store.ScheduleService, store.EndpointService, fileService, reverseTunnelService)
	if err != nil {
		log.Fatal(err)
	}

	err = loadEndpointSyncSystemSchedule(jobScheduler, store.ScheduleService, store.EndpointService, flags)
	if err != nil {
		log.Fatal(err)
	}

	if *flags.Snapshot {
		err = loadSnapshotSystemSchedule(jobScheduler, snapshotter, store.ScheduleService, store.EndpointService, store.SettingsService)
		if err != nil {
			log.Fatal(err)
		}
	}

	jobScheduler.Start()

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
		adminPasswordHash, err = cryptoService.Hash(strings.TrimSuffix(string(content), "\n"))
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
				Username:                "admin",
				Role:                    portainer.AdministratorRole,
				Password:                adminPasswordHash,
				PortainerAuthorizations: portainer.DefaultPortainerAuthorizations(),
			}
			err := store.UserService.CreateUser(user)
			if err != nil {
				log.Fatal(err)
			}
		} else {
			log.Println("Instance already has an administrator user defined. Skipping admin password related flags.")
		}
	}

	if !*flags.NoAuth {
		go terminateIfNoAdminCreated(store.UserService)
	}

	err = reverseTunnelService.StartTunnelServer(*flags.TunnelAddr, *flags.TunnelPort, snapshotter)
	if err != nil {
		log.Fatal(err)
	}

	var server portainer.Server = &http.Server{
		ReverseTunnelService:   reverseTunnelService,
		Status:                 applicationStatus,
		BindAddress:            *flags.Addr,
		AssetsPath:             *flags.Assets,
		AuthDisabled:           *flags.NoAuth,
		EndpointManagement:     endpointManagement,
		RoleService:            store.RoleService,
		UserService:            store.UserService,
		TeamService:            store.TeamService,
		TeamMembershipService:  store.TeamMembershipService,
		EndpointService:        store.EndpointService,
		EndpointGroupService:   store.EndpointGroupService,
		ExtensionService:       store.ExtensionService,
		ResourceControlService: store.ResourceControlService,
		SettingsService:        store.SettingsService,
		RegistryService:        store.RegistryService,
		DockerHubService:       store.DockerHubService,
		StackService:           store.StackService,
		ScheduleService:        store.ScheduleService,
		TagService:             store.TagService,
		TemplateService:        store.TemplateService,
		WebhookService:         store.WebhookService,
		SwarmStackManager:      swarmStackManager,
		ComposeStackManager:    composeStackManager,
		ExtensionManager:       extensionManager,
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
