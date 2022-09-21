package main

import (
	"context"
	"crypto/sha256"
	"fmt"
	"os"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/portainer/libhelm"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/build"
	"github.com/portainer/portainer/api/chisel"
	"github.com/portainer/portainer/api/cli"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/database"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/demo"
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

	"github.com/rs/zerolog/log"
)

func initCLI() *portainer.CLIFlags {
	var cliService portainer.CLIService = &cli.Service{}
	flags, err := cliService.ParseFlags(portainer.APIVersion)
	if err != nil {
		log.Fatal().Err(err).Msg("failed parsing flags")
	}

	err = cliService.ValidateFlags(flags)
	if err != nil {
		log.Fatal().Err(err).Msg("failed validating flags")
	}

	return flags
}

func initFileService(dataStorePath string) portainer.FileService {
	fileService, err := filesystem.NewService(dataStorePath, "")
	if err != nil {
		log.Fatal().Err(err).Msg("failed creating file service")
	}

	return fileService
}

func initDataStore(flags *portainer.CLIFlags, secretKey []byte, fileService portainer.FileService, shutdownCtx context.Context) dataservices.DataStore {
	connection, err := database.NewDatabase("boltdb", *flags.Data, secretKey)
	if err != nil {
		log.Fatal().Err(err).Msg("failed creating database connection")
	}

	if bconn, ok := connection.(*boltdb.DbConnection); ok {
		bconn.MaxBatchSize = *flags.MaxBatchSize
		bconn.MaxBatchDelay = *flags.MaxBatchDelay
		bconn.InitialMmapSize = *flags.InitialMmapSize
	} else {
		log.Fatal().Msg("failed creating database connection: expecting a boltdb database type but a different one was received")
	}

	store := datastore.NewStore(*flags.Data, fileService, connection)
	isNew, err := store.Open()
	if err != nil {
		log.Fatal().Err(err).Msg("failed opening store")
	}

	if *flags.Rollback {
		err := store.Rollback(false)
		if err != nil {
			log.Fatal().Err(err).Msg("failed rolling back")
		}

		log.Info().Msg("exiting rollback")
		os.Exit(0)

		return nil
	}

	// Init sets some defaults - it's basically a migration
	err = store.Init()
	if err != nil {
		log.Fatal().Err(err).Msg("failed initializing data store")
	}

	if isNew {
		// from MigrateData
		store.VersionService.StoreDBVersion(portainer.DBVersion)

		err := updateSettingsFromFlags(store, flags)
		if err != nil {
			log.Fatal().Err(err).Msg("failed updating settings from flags")
		}
	} else {
		storedVersion, err := store.VersionService.DBVersion()
		if err != nil {
			log.Fatal().Err(err).Msg("failure during creation of new database")
		}

		if storedVersion != portainer.DBVersion {
			err = store.MigrateData()
			if err != nil {
				log.Fatal().Err(err).Msg("failed migration")
			}
		}
	}

	err = updateSettingsFromFlags(store, flags)
	if err != nil {
		log.Fatal().Err(err).Msg("failed updating settings from flags")
	}

	// this is for the db restore functionality - needs more tests.
	go func() {
		<-shutdownCtx.Done()
		defer connection.Close()

		exportFilename := path.Join(*flags.Data, fmt.Sprintf("export-%d.json", time.Now().Unix()))

		err := store.Export(exportFilename)
		if err != nil {
			log.Error().Str("filename", exportFilename).Err(err).Msg("failed to export")
		} else {
			log.Debug().Str("filename", exportFilename).Msg("exported")
		}
	}()

	return store
}

func initComposeStackManager(assetsPath string, configPath string, reverseTunnelService portainer.ReverseTunnelService, proxyManager *proxy.Manager) portainer.ComposeStackManager {
	composeWrapper, err := exec.NewComposeStackManager(assetsPath, configPath, proxyManager)
	if err != nil {
		log.Fatal().Err(err).Msg("failed creating compose manager")
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

func initGitService(ctx context.Context) portainer.GitService {
	return git.NewService(ctx)
}

func initSSLService(addr, certPath, keyPath string, fileService portainer.FileService, dataStore dataservices.DataStore, shutdownTrigger context.CancelFunc) (*ssl.Service, error) {
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

func initSnapshotService(snapshotIntervalFromFlag string, dataStore dataservices.DataStore, dockerClientFactory *docker.ClientFactory, kubernetesClientFactory *kubecli.ClientFactory, shutdownCtx context.Context) (portainer.SnapshotService, error) {
	dockerSnapshotter := docker.NewSnapshotter(dockerClientFactory)
	kubernetesSnapshotter := kubernetes.NewSnapshotter(kubernetesClientFactory)

	snapshotService, err := snapshot.NewService(snapshotIntervalFromFlag, dataStore, dockerSnapshotter, kubernetesSnapshotter, shutdownCtx)
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

	if *flags.SnapshotInterval != "" {
		settings.SnapshotInterval = *flags.SnapshotInterval
	}

	if *flags.Logo != "" {
		settings.LogoURL = *flags.Logo
	}

	if *flags.EnableEdgeComputeFeatures {
		settings.EnableEdgeComputeFeatures = *flags.EnableEdgeComputeFeatures
	}

	if *flags.Templates != "" {
		settings.TemplatesURL = *flags.Templates
	}

	if *flags.Labels != nil {
		settings.BlackListedLabels = *flags.Labels
	}

	if agentKey, ok := os.LookupEnv("AGENT_SECRET"); ok {
		settings.AgentSecret = agentKey
	} else {
		settings.AgentSecret = ""
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
	} else if *flags.HTTPEnabled {
		sslSettings.HTTPEnabled = true
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

		log.Info().Str("feature", string(*correspondingFeature)).Bool("state", featureState).Msg("")

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
		log.Fatal().Err(err).Msg("failed checking for existing key pair")
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
		log.Error().
			Str("endpoint", endpoint.Name).
			Str("URL", endpoint.URL).
			Err(err).
			Msg("environment snapshot error")
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
		log.Error().
			Str("endpoint", endpoint.Name).
			Str("URL", endpoint.URL).Err(err).
			Msg("environment snapshot error")
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
		log.Info().Msg("instance already has defined environments, skipping the environment defined via CLI")

		return nil
	}

	if *flags.TLS || *flags.TLSSkipVerify {
		return createTLSSecuredEndpoint(flags, dataStore, snapshotService)
	}
	return createUnsecuredEndpoint(*flags.EndpointURL, dataStore, snapshotService)
}

func loadEncryptionSecretKey(keyfilename string) []byte {
	content, err := os.ReadFile(path.Join("/run/secrets", keyfilename))
	if err != nil {
		if os.IsNotExist(err) {
			log.Info().Str("filename", keyfilename).Msg("encryption key file not present")
		} else {
			log.Info().Err(err).Msg("error reading encryption key file")
		}

		return nil
	}

	// return a 32 byte hash of the secret (required for AES)
	hash := sha256.Sum256(content)
	return hash[:]
}

func buildServer(flags *portainer.CLIFlags) portainer.Server {
	shutdownCtx, shutdownTrigger := context.WithCancel(context.Background())

	fileService := initFileService(*flags.Data)
	encryptionKey := loadEncryptionSecretKey(*flags.SecretKeyName)
	if encryptionKey == nil {
		log.Info().Msg("proceeding without encryption key")
	}

	dataStore := initDataStore(flags, encryptionKey, fileService, shutdownCtx)

	if err := dataStore.CheckCurrentEdition(); err != nil {
		log.Fatal().Err(err).Msg("")
	}

	instanceID, err := dataStore.Version().InstanceID()
	if err != nil {
		log.Fatal().Err(err).Msg("failed getting instance id")
	}

	apiKeyService := initAPIKeyService(dataStore)

	settings, err := dataStore.Settings().Settings()
	if err != nil {
		log.Fatal().Err(err).Msg("")
	}

	jwtService, err := initJWTService(settings.UserSessionTimeout, dataStore)
	if err != nil {
		log.Fatal().Err(err).Msg("failed initializing JWT service")
	}

	err = enableFeaturesFromFlags(dataStore, flags)
	if err != nil {
		log.Fatal().Err(err).Msg("failed enabling feature flag")
	}

	ldapService := initLDAPService()

	oauthService := initOAuthService()
	gitService := initGitService(shutdownCtx)

	openAMTService := openamt.NewService()

	cryptoService := initCryptoService()

	digitalSignatureService := initDigitalSignatureService()

	sslService, err := initSSLService(*flags.AddrHTTPS, *flags.SSLCert, *flags.SSLKey, fileService, dataStore, shutdownTrigger)
	if err != nil {
		log.Fatal().Err(err).Msg("")
	}

	sslSettings, err := sslService.GetSSLSettings()
	if err != nil {
		log.Fatal().Err(err).Msg("failed to get SSL settings")
	}

	err = initKeyPair(fileService, digitalSignatureService)
	if err != nil {
		log.Fatal().Err(err).Msg("failed initializing key pair")
	}

	reverseTunnelService := chisel.NewService(dataStore, shutdownCtx)

	dockerClientFactory := initDockerClientFactory(digitalSignatureService, reverseTunnelService)
	kubernetesClientFactory := initKubernetesClientFactory(digitalSignatureService, reverseTunnelService, instanceID, dataStore)

	snapshotService, err := initSnapshotService(*flags.SnapshotInterval, dataStore, dockerClientFactory, kubernetesClientFactory, shutdownCtx)
	if err != nil {
		log.Fatal().Err(err).Msg("failed initializing snapshot service")
	}
	snapshotService.Start()

	authorizationService := authorization.NewService(dataStore)
	authorizationService.K8sClientFactory = kubernetesClientFactory

	kubernetesTokenCacheManager := kubeproxy.NewTokenCacheManager()

	kubeClusterAccessService := kubernetes.NewKubeClusterAccessService(*flags.BaseURL, *flags.AddrHTTPS, sslSettings.CertPath)

	proxyManager := proxy.NewManager(dataStore, digitalSignatureService, reverseTunnelService, dockerClientFactory, kubernetesClientFactory, kubernetesTokenCacheManager, gitService)

	reverseTunnelService.ProxyManager = proxyManager

	dockerConfigPath := fileService.GetDockerConfigPath()

	composeStackManager := initComposeStackManager(*flags.Assets, dockerConfigPath, reverseTunnelService, proxyManager)

	swarmStackManager, err := initSwarmStackManager(*flags.Assets, dockerConfigPath, digitalSignatureService, fileService, reverseTunnelService, dataStore)
	if err != nil {
		log.Fatal().Err(err).Msg("failed initializing swarm stack manager")
	}

	kubernetesDeployer := initKubernetesDeployer(kubernetesTokenCacheManager, kubernetesClientFactory, dataStore, reverseTunnelService, digitalSignatureService, proxyManager, *flags.Assets)

	helmPackageManager, err := initHelmPackageManager(*flags.Assets)
	if err != nil {
		log.Fatal().Err(err).Msg("failed initializing helm package manager")
	}

	err = edge.LoadEdgeJobs(dataStore, reverseTunnelService)
	if err != nil {
		log.Fatal().Err(err).Msg("failed loading edge jobs from database")
	}

	applicationStatus := initStatus(instanceID)

	demoService := demo.NewService()
	if *flags.DemoEnvironment {
		err := demoService.Init(dataStore, cryptoService)
		if err != nil {
			log.Fatal().Err(err).Msg("failed initializing demo environment")
		}
	}

	err = initEndpoint(flags, dataStore, snapshotService)
	if err != nil {
		log.Fatal().Err(err).Msg("failed initializing environment")
	}

	adminPasswordHash := ""
	if *flags.AdminPasswordFile != "" {
		content, err := fileService.GetFileContent(*flags.AdminPasswordFile, "")
		if err != nil {
			log.Fatal().Err(err).Msg("failed getting admin password file")
		}

		adminPasswordHash, err = cryptoService.Hash(strings.TrimSuffix(string(content), "\n"))
		if err != nil {
			log.Fatal().Err(err).Msg("failed hashing admin password")
		}
	} else if *flags.AdminPassword != "" {
		adminPasswordHash = *flags.AdminPassword
	}

	if adminPasswordHash != "" {
		users, err := dataStore.User().UsersByRole(portainer.AdministratorRole)
		if err != nil {
			log.Fatal().Err(err).Msg("failed getting admin user")
		}

		if len(users) == 0 {
			log.Info().Msg("created admin user with the given password.")
			user := &portainer.User{
				Username: "admin",
				Role:     portainer.AdministratorRole,
				Password: adminPasswordHash,
			}

			err := dataStore.User().Create(user)
			if err != nil {
				log.Fatal().Err(err).Msg("failed creating admin user")
			}
		} else {
			log.Info().Msg("instance already has an administrator user defined, skipping admin password related flags.")
		}
	}

	err = reverseTunnelService.StartTunnelServer(*flags.TunnelAddr, *flags.TunnelPort, snapshotService)
	if err != nil {
		log.Fatal().Err(err).Msg("failed starting tunnel server")
	}

	sslDBSettings, err := dataStore.SSLSettings().Settings()
	if err != nil {
		log.Fatal().Msg("failed to fetch SSL settings from DB")
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
		KubeClusterAccessService:    kubeClusterAccessService,
		SignatureService:            digitalSignatureService,
		SnapshotService:             snapshotService,
		SSLService:                  sslService,
		DockerClientFactory:         dockerClientFactory,
		KubernetesClientFactory:     kubernetesClientFactory,
		Scheduler:                   scheduler,
		ShutdownCtx:                 shutdownCtx,
		ShutdownTrigger:             shutdownTrigger,
		StackDeployer:               stackDeployer,
		DemoService:                 demoService,
	}
}

func main() {
	configureLogger()

	flags := initCLI()

	setLoggingLevel(*flags.LogLevel)

	for {
		server := buildServer(flags)
		log.Info().
			Str("version", portainer.APIVersion).
			Str("build_number", build.BuildNumber).
			Str("image_tag", build.ImageTag).
			Str("nodejs_version", build.NodejsVersion).
			Str("yarn_version", build.YarnVersion).
			Str("webpack_version", build.WebpackVersion).
			Str("go_version", build.GoVersion).
			Msg("starting Portainer")

		err := server.Start()
		log.Info().Err(err).Msg("HTTP server exited")
	}
}
