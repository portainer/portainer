package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"github.com/portainer/libhelm"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/chisel"
	"github.com/portainer/portainer/api/cli"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/database"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/docker"
	"github.com/portainer/portainer/api/exec"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/git"
	"github.com/portainer/portainer/api/hostmanagement/openamt"
	"github.com/portainer/portainer/api/http"
	"github.com/portainer/portainer/api/http/client"
	"github.com/portainer/portainer/api/http/proxy"
	kubeproxy "github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/snapshot"
	"github.com/portainer/portainer/api/internal/ssl"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/api/kubernetes"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/ldap"
	"github.com/portainer/portainer/api/oauth"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks"
)

func initCLI() *portainer.CLIFlags {
	var cliService portainer.CLIService = &cli.Service{}
	flags, err := cliService.ParseFlags(portainer.APIVersion)
	if err != nil {
		log.Fatalf("failed parsing flags: %v", err)
	}

	err = cliService.ValidateFlags(flags)
	if err != nil {
		log.Fatalf("failed validating flags:%v", err)
	}
	return flags
}

func initFileService(dataStorePath string) portainer.FileService {
	fileService, err := filesystem.NewService(dataStorePath, "")
	if err != nil {
		log.Fatalf("failed creating file service: %v", err)
	}
	return fileService
}

func initDataStore(flags *portainer.CLIFlags, fileService portainer.FileService, shutdownCtx context.Context) dataservices.DataStore {
	connection, err := database.NewDatabase("boltdb", *flags.Data)
	if err != nil {
		panic(err)
	}
	store := datastore.NewStore(*flags.Data, fileService, connection)
	isNew, err := store.Open()
	if err != nil {
		log.Fatalf("failed opening store: %v", err)
	}

	if *flags.Rollback {
		err := store.Rollback(false)
		if err != nil {
			log.Fatalf("failed rolling back: %s", err)
		}

		log.Println("Exiting rollback")
		os.Exit(0)
		return nil
	}

	// Init sets some defaults - its basically a migration
	err = store.Init()
	if err != nil {
		log.Fatalf("failed initializing data store: %v", err)
	}

	if isNew {
		// from MigrateData
		store.VersionService.StoreDBVersion(portainer.DBVersion)

		// Disabled for now.  Can't use feature flags due to the way that works
		// EXPERIMENTAL, will only activate if `/data/import.json` exists
		//importFromJson(fileService, store)

		err := updateSettingsFromFlags(store, flags)
		if err != nil {
			log.Fatalf("failed updating settings from flags: %v", err)
		}
	}

	storedVersion, err := store.VersionService.DBVersion()
	if err != nil {
		log.Fatalf("Something failed during creation of new database: %v", err)
	}
	if storedVersion != portainer.DBVersion {
		err = store.MigrateData()
		if err != nil {
			log.Fatalf("failed migration: %v", err)
		}
	}

	// this is for the db restore functionality - needs more tests.
	go func() {
		<-shutdownCtx.Done()
		defer connection.Close()

		exportFilename := path.Join(*flags.Data, fmt.Sprintf("export-%d.json", time.Now().Unix()))

		err := store.Export(exportFilename)
		if err != nil {
			logrus.WithError(err).Debugf("failed to export to %s", exportFilename)
		} else {
			logrus.Debugf("exported to %s", exportFilename)
		}
		connection.Close()
	}()
	return store
}

func initComposeStackManager(assetsPath string, configPath string, reverseTunnelService portainer.ReverseTunnelService, proxyManager *proxy.Manager) portainer.ComposeStackManager {
	composeWrapper, err := exec.NewComposeStackManager(assetsPath, configPath, proxyManager)
	if err != nil {
		log.Fatalf("failed creating compose manager: %s", err)
	}

	return composeWrapper
}

func initSwarmStackManager(
	assetsPath string,
	configPath string,
	signatureService portainer.DigitalSignatureService,
	fileService portainer.FileService,
	reverseTunnelService portainer.ReverseTunnelService,
	dataStore dataservices.DataStore,
) (portainer.SwarmStackManager, error) {
	return exec.NewSwarmStackManager(assetsPath, configPath, signatureService, fileService, reverseTunnelService, dataStore)
}

func initKubernetesDeployer(kubernetesTokenCacheManager *kubeproxy.TokenCacheManager, kubernetesClientFactory *kubecli.ClientFactory, dataStore dataservices.DataStore, reverseTunnelService portainer.ReverseTunnelService, signatureService portainer.DigitalSignatureService, proxyManager *proxy.Manager, assetsPath string) portainer.KubernetesDeployer {
	return exec.NewKubernetesDeployer(kubernetesTokenCacheManager, kubernetesClientFactory, dataStore, reverseTunnelService, signatureService, proxyManager, assetsPath)
}

func initHelmPackageManager(assetsPath string) (libhelm.HelmPackageManager, error) {
	return libhelm.NewHelmPackageManager(libhelm.HelmConfig{BinaryPath: assetsPath})
}

func initAPIKeyService(datastore dataservices.DataStore) apikey.APIKeyService {
	return apikey.NewAPIKeyService(datastore.APIKeyRepository(), datastore.User())
}

func initJWTService(userSessionTimeout string, dataStore dataservices.DataStore) (dataservices.JWTService, error) {
	jwtService, err := jwt.NewService(userSessionTimeout, dataStore)
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

func initOAuthService() portainer.OAuthService {
	return oauth.NewService()
}

func initGitService() portainer.GitService {
	return git.NewService()
}

func initSSLService(addr, dataPath, certPath, keyPath string, fileService portainer.FileService, dataStore dataservices.DataStore, shutdownTrigger context.CancelFunc) (*ssl.Service, error) {
	slices := strings.Split(addr, ":")
	host := slices[0]
	if host == "" {
		host = "0.0.0.0"
	}

	sslService := ssl.NewService(fileService, dataStore, shutdownTrigger)

	err := sslService.Init(host, certPath, keyPath)
	if err != nil {
		return nil, err
	}

	return sslService, nil
}

func initDockerClientFactory(signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService) *docker.ClientFactory {
	return docker.NewClientFactory(signatureService, reverseTunnelService)
}

func initKubernetesClientFactory(signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService, instanceID string, dataStore dataservices.DataStore) *kubecli.ClientFactory {
	return kubecli.NewClientFactory(signatureService, reverseTunnelService, instanceID, dataStore)
}

func initSnapshotService(snapshotInterval string, dataStore dataservices.DataStore, dockerClientFactory *docker.ClientFactory, kubernetesClientFactory *kubecli.ClientFactory, shutdownCtx context.Context) (portainer.SnapshotService, error) {
	dockerSnapshotter := docker.NewSnapshotter(dockerClientFactory)
	kubernetesSnapshotter := kubernetes.NewSnapshotter(kubernetesClientFactory)

	snapshotService, err := snapshot.NewService(snapshotInterval, dataStore, dockerSnapshotter, kubernetesSnapshotter, shutdownCtx)
	if err != nil {
		return nil, err
	}

	return snapshotService, nil
}

func initStatus(instanceID string) *portainer.Status {
	return &portainer.Status{
		Version:    portainer.APIVersion,
		InstanceID: instanceID,
	}
}

func updateSettingsFromFlags(dataStore dataservices.DataStore, flags *portainer.CLIFlags) error {
	settings, err := dataStore.Settings().Settings()
	if err != nil {
		return err
	}

	settings.LogoURL = *flags.Logo
	settings.SnapshotInterval = *flags.SnapshotInterval
	settings.EnableEdgeComputeFeatures = *flags.EnableEdgeComputeFeatures
	settings.EnableTelemetry = true
	settings.OAuthSettings.SSO = true

	if *flags.Templates != "" {
		settings.TemplatesURL = *flags.Templates
	}

	if *flags.Labels != nil {
		settings.BlackListedLabels = *flags.Labels
	}

	err = dataStore.Settings().UpdateSettings(settings)
	if err != nil {
		return err
	}

	sslSettings, err := dataStore.SSLSettings().Settings()
	if err != nil {
		return err
	}

	if *flags.HTTPDisabled {
		sslSettings.HTTPEnabled = false
	} else {
		sslSettings.HTTPEnabled = *flags.HTTPEnabled || sslSettings.HTTPEnabled
	}

	err = dataStore.SSLSettings().UpdateSettings(sslSettings)
	if err != nil {
		return err
	}

	return nil
}

// enableFeaturesFromFlags turns on or off feature flags
// e.g.  portainer --feat open-amt --feat fdo=true ... (defaults to true)
// note, settings are persisted to the DB. To turn off `--feat open-amt=false`
func enableFeaturesFromFlags(dataStore dataservices.DataStore, flags *portainer.CLIFlags) error {
	settings, err := dataStore.Settings().Settings()
	if err != nil {
		return err
	}

	if settings.FeatureFlagSettings == nil {
		settings.FeatureFlagSettings = make(map[portainer.Feature]bool)
	}

	// loop through feature flags to check if they are supported
	for _, feat := range *flags.FeatureFlags {
		var correspondingFeature *portainer.Feature
		for i, supportedFeat := range portainer.SupportedFeatureFlags {
			if strings.EqualFold(feat.Name, string(supportedFeat)) {
				correspondingFeature = &portainer.SupportedFeatureFlags[i]
			}
		}

		if correspondingFeature == nil {
			return fmt.Errorf("unknown feature flag '%s'", feat.Name)
		}

		featureState, err := strconv.ParseBool(feat.Value)
		if err != nil {
			return fmt.Errorf("feature flag's '%s' value should be true or false", feat.Name)
		}

		if featureState {
			log.Printf("Feature %v : on", *correspondingFeature)
		} else {
			log.Printf("Feature %v : off", *correspondingFeature)
		}

		settings.FeatureFlagSettings[*correspondingFeature] = featureState
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
		log.Fatalf("failed checking for existing key pair: %v", err)
	}

	if existingKeyPair {
		return loadAndParseKeyPair(fileService, signatureService)
	}
	return generateAndStoreKeyPair(fileService, signatureService)
}

func createTLSSecuredEndpoint(flags *portainer.CLIFlags, dataStore dataservices.DataStore, snapshotService portainer.SnapshotService) error {
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

		SecuritySettings: portainer.EndpointSecuritySettings{
			AllowVolumeBrowserForRegularUsers: false,
			EnableHostManagementFeatures:      false,

			AllowSysctlSettingForRegularUsers:         true,
			AllowBindMountsForRegularUsers:            true,
			AllowPrivilegedModeForRegularUsers:        true,
			AllowHostNamespaceForRegularUsers:         true,
			AllowContainerCapabilitiesForRegularUsers: true,
			AllowDeviceMappingForRegularUsers:         true,
			AllowStackManagementForRegularUsers:       true,
		},
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

	err := snapshotService.SnapshotEndpoint(endpoint)
	if err != nil {
		log.Printf("http error: environment snapshot error (environment=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
	}

	return dataStore.Endpoint().Create(endpoint)
}

func createUnsecuredEndpoint(endpointURL string, dataStore dataservices.DataStore, snapshotService portainer.SnapshotService) error {
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

		SecuritySettings: portainer.EndpointSecuritySettings{
			AllowVolumeBrowserForRegularUsers: false,
			EnableHostManagementFeatures:      false,

			AllowSysctlSettingForRegularUsers:         true,
			AllowBindMountsForRegularUsers:            true,
			AllowPrivilegedModeForRegularUsers:        true,
			AllowHostNamespaceForRegularUsers:         true,
			AllowContainerCapabilitiesForRegularUsers: true,
			AllowDeviceMappingForRegularUsers:         true,
			AllowStackManagementForRegularUsers:       true,
		},
	}

	err := snapshotService.SnapshotEndpoint(endpoint)
	if err != nil {
		log.Printf("http error: environment snapshot error (environment=%s, URL=%s) (err=%s)\n", endpoint.Name, endpoint.URL, err)
	}

	return dataStore.Endpoint().Create(endpoint)
}

func initEndpoint(flags *portainer.CLIFlags, dataStore dataservices.DataStore, snapshotService portainer.SnapshotService) error {
	if *flags.EndpointURL == "" {
		return nil
	}

	endpoints, err := dataStore.Endpoint().Endpoints()
	if err != nil {
		return err
	}

	if len(endpoints) > 0 {
		log.Println("Instance already has defined environments. Skipping the environment defined via CLI.")
		return nil
	}

	if *flags.TLS || *flags.TLSSkipVerify {
		return createTLSSecuredEndpoint(flags, dataStore, snapshotService)
	}
	return createUnsecuredEndpoint(*flags.EndpointURL, dataStore, snapshotService)
}

func buildServer(flags *portainer.CLIFlags) portainer.Server {
	shutdownCtx, shutdownTrigger := context.WithCancel(context.Background())

	fileService := initFileService(*flags.Data)

	dataStore := initDataStore(flags, fileService, shutdownCtx)

	if err := dataStore.CheckCurrentEdition(); err != nil {
		log.Fatal(err)
	}
	instanceID, err := dataStore.Version().InstanceID()
	if err != nil {
		log.Fatalf("failed getting instance id: %v", err)
	}

	apiKeyService := initAPIKeyService(dataStore)

	settings, err := dataStore.Settings().Settings()
	if err != nil {
		log.Fatal(err)
	}
	jwtService, err := initJWTService(settings.UserSessionTimeout, dataStore)
	if err != nil {
		log.Fatalf("failed initializing JWT service: %v", err)
	}

	err = enableFeaturesFromFlags(dataStore, flags)
	if err != nil {
		log.Fatalf("failed enabling feature flag: %v", err)
	}

	ldapService := initLDAPService()
	oauthService := initOAuthService()
	gitService := initGitService()

	openAMTService := openamt.NewService(dataStore)

	cryptoService := initCryptoService()
	digitalSignatureService := initDigitalSignatureService()

	sslService, err := initSSLService(*flags.AddrHTTPS, *flags.Data, *flags.SSLCert, *flags.SSLKey, fileService, dataStore, shutdownTrigger)
	if err != nil {
		log.Fatal(err)
	}

	sslSettings, err := sslService.GetSSLSettings()
	if err != nil {
		log.Fatalf("failed to get ssl settings: %s", err)
	}

	err = initKeyPair(fileService, digitalSignatureService)
	if err != nil {
		log.Fatalf("failed initializing key pair: %v", err)
	}

	reverseTunnelService := chisel.NewService(dataStore, shutdownCtx)

	dockerClientFactory := initDockerClientFactory(digitalSignatureService, reverseTunnelService)
	kubernetesClientFactory := initKubernetesClientFactory(digitalSignatureService, reverseTunnelService, instanceID, dataStore)

	snapshotService, err := initSnapshotService(*flags.SnapshotInterval, dataStore, dockerClientFactory, kubernetesClientFactory, shutdownCtx)
	if err != nil {
		log.Fatalf("failed initializing snapshot service: %v", err)
	}
	snapshotService.Start()

	authorizationService := authorization.NewService(dataStore)
	authorizationService.K8sClientFactory = kubernetesClientFactory

	kubernetesTokenCacheManager := kubeproxy.NewTokenCacheManager()

	kubeConfigService := kubernetes.NewKubeConfigCAService(*flags.AddrHTTPS, sslSettings.CertPath)

	proxyManager := proxy.NewManager(dataStore, digitalSignatureService, reverseTunnelService, dockerClientFactory, kubernetesClientFactory, kubernetesTokenCacheManager)

	reverseTunnelService.ProxyManager = proxyManager

	dockerConfigPath := fileService.GetDockerConfigPath()

	composeStackManager := initComposeStackManager(*flags.Assets, dockerConfigPath, reverseTunnelService, proxyManager)

	swarmStackManager, err := initSwarmStackManager(*flags.Assets, dockerConfigPath, digitalSignatureService, fileService, reverseTunnelService, dataStore)
	if err != nil {
		log.Fatalf("failed initializing swarm stack manager: %s", err)
	}

	kubernetesDeployer := initKubernetesDeployer(kubernetesTokenCacheManager, kubernetesClientFactory, dataStore, reverseTunnelService, digitalSignatureService, proxyManager, *flags.Assets)

	helmPackageManager, err := initHelmPackageManager(*flags.Assets)
	if err != nil {
		log.Fatalf("failed initializing helm package manager: %s", err)
	}

	err = edge.LoadEdgeJobs(dataStore, reverseTunnelService)
	if err != nil {
		log.Fatalf("failed loading edge jobs from database: %v", err)
	}

	applicationStatus := initStatus(instanceID)

	err = initEndpoint(flags, dataStore, snapshotService)
	if err != nil {
		log.Fatalf("failed initializing environment: %v", err)
	}

	adminPasswordHash := ""
	if *flags.AdminPasswordFile != "" {
		content, err := fileService.GetFileContent(*flags.AdminPasswordFile, "")
		if err != nil {
			log.Fatalf("failed getting admin password file: %v", err)
		}
		adminPasswordHash, err = cryptoService.Hash(strings.TrimSuffix(string(content), "\n"))
		if err != nil {
			log.Fatalf("failed hashing admin password: %v", err)
		}
	} else if *flags.AdminPassword != "" {
		adminPasswordHash = *flags.AdminPassword
	}

	if adminPasswordHash != "" {
		users, err := dataStore.User().UsersByRole(portainer.AdministratorRole)
		if err != nil {
			log.Fatalf("failed getting admin user: %v", err)
		}

		if len(users) == 0 {
			log.Println("Created admin user with the given password.")
			user := &portainer.User{
				Username: "admin",
				Role:     portainer.AdministratorRole,
				Password: adminPasswordHash,
			}
			err := dataStore.User().Create(user)
			if err != nil {
				log.Fatalf("failed creating admin user: %v", err)
			}
		} else {
			log.Println("Instance already has an administrator user defined. Skipping admin password related flags.")
		}
	}

	err = reverseTunnelService.StartTunnelServer(*flags.TunnelAddr, *flags.TunnelPort, snapshotService)
	if err != nil {
		log.Fatalf("failed starting tunnel server: %s", err)
	}

	sslDBSettings, err := dataStore.SSLSettings().Settings()
	if err != nil {
		log.Fatalf("failed to fetch ssl settings from DB")
	}

	scheduler := scheduler.NewScheduler(shutdownCtx)
	stackDeployer := stacks.NewStackDeployer(swarmStackManager, composeStackManager, kubernetesDeployer)
	stacks.StartStackSchedules(scheduler, stackDeployer, dataStore, gitService)

	return &http.Server{
		AuthorizationService:        authorizationService,
		ReverseTunnelService:        reverseTunnelService,
		Status:                      applicationStatus,
		BindAddress:                 *flags.Addr,
		BindAddressHTTPS:            *flags.AddrHTTPS,
		HTTPEnabled:                 sslDBSettings.HTTPEnabled,
		AssetsPath:                  *flags.Assets,
		DataStore:                   dataStore,
		SwarmStackManager:           swarmStackManager,
		ComposeStackManager:         composeStackManager,
		KubernetesDeployer:          kubernetesDeployer,
		HelmPackageManager:          helmPackageManager,
		CryptoService:               cryptoService,
		APIKeyService:               apiKeyService,
		JWTService:                  jwtService,
		FileService:                 fileService,
		LDAPService:                 ldapService,
		OAuthService:                oauthService,
		GitService:                  gitService,
		OpenAMTService:              openAMTService,
		ProxyManager:                proxyManager,
		KubernetesTokenCacheManager: kubernetesTokenCacheManager,
		KubeConfigService:           kubeConfigService,
		SignatureService:            digitalSignatureService,
		SnapshotService:             snapshotService,
		SSLService:                  sslService,
		DockerClientFactory:         dockerClientFactory,
		KubernetesClientFactory:     kubernetesClientFactory,
		Scheduler:                   scheduler,
		ShutdownCtx:                 shutdownCtx,
		ShutdownTrigger:             shutdownTrigger,
		StackDeployer:               stackDeployer,
		BaseURL:                     *flags.BaseURL,
	}
}

func main() {
	flags := initCLI()

	configureLogger()

	for {
		server := buildServer(flags)
		log.Printf("[INFO] [cmd,main] Starting Portainer version %s\n", portainer.APIVersion)
		err := server.Start()
		log.Printf("[INFO] [cmd,main] Http server exited: %s\n", err)
	}
}
