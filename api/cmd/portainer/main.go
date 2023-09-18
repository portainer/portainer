package main

import (
	"context"
	"crypto/sha256"
	"math/rand"
	"os"
	"path"
	"strings"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/build"
	"github.com/portainer/portainer/api/chisel"
	"github.com/portainer/portainer/api/cli"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/database"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/database/models"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/datastore"
	"github.com/portainer/portainer/api/datastore/migrator"
	"github.com/portainer/portainer/api/demo"
	"github.com/portainer/portainer/api/docker"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/exec"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/git"
	"github.com/portainer/portainer/api/hostmanagement/openamt"
	"github.com/portainer/portainer/api/http"
	"github.com/portainer/portainer/api/http/proxy"
	kubeproxy "github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
	"github.com/portainer/portainer/api/internal/authorization"
	"github.com/portainer/portainer/api/internal/edge"
	"github.com/portainer/portainer/api/internal/edge/edgestacks"
	"github.com/portainer/portainer/api/internal/endpointutils"
	"github.com/portainer/portainer/api/internal/snapshot"
	"github.com/portainer/portainer/api/internal/ssl"
	"github.com/portainer/portainer/api/internal/upgrade"
	"github.com/portainer/portainer/api/jwt"
	"github.com/portainer/portainer/api/kubernetes"
	kubecli "github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/ldap"
	"github.com/portainer/portainer/api/oauth"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks/deployments"
	"github.com/portainer/portainer/pkg/featureflags"
	"github.com/portainer/portainer/pkg/libhelm"
	"github.com/portainer/portainer/pkg/libstack"
	"github.com/portainer/portainer/pkg/libstack/compose"

	"github.com/gofrs/uuid"
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
	}

	// Init sets some defaults - it's basically a migration
	err = store.Init()
	if err != nil {
		log.Fatal().Err(err).Msg("failed initializing data store")
	}

	if isNew {
		instanceId, err := uuid.NewV4()
		if err != nil {
			log.Fatal().Err(err).Msg("failed generating instance id")
		}

		migratorInstance := migrator.NewMigrator(&migrator.MigratorParameters{})
		migratorCount := migratorInstance.GetMigratorCountOfCurrentAPIVersion()

		// from MigrateData
		v := models.Version{
			SchemaVersion: portainer.APIVersion,
			Edition:       int(portainer.PortainerCE),
			InstanceID:    instanceId.String(),
			MigratorCount: migratorCount,
		}
		store.VersionService.UpdateVersion(&v)

		err = updateSettingsFromFlags(store, flags)
		if err != nil {
			log.Fatal().Err(err).Msg("failed updating settings from flags")
		}
	} else {
		err = store.MigrateData()
		if err != nil {
			log.Fatal().Err(err).Msg("failed migration")
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
	}()

	return store
}

// checkDBSchemaServerVersionMatch checks if the server version matches the db scehma version
func checkDBSchemaServerVersionMatch(dbStore dataservices.DataStore, serverVersion string, serverEdition int) bool {
	v, err := dbStore.Version().Version()
	if err != nil {
		return false
	}

	return v.SchemaVersion == serverVersion && v.Edition == serverEdition
}

func initComposeStackManager(composeDeployer libstack.Deployer, proxyManager *proxy.Manager) portainer.ComposeStackManager {
	composeWrapper, err := exec.NewComposeStackManager(composeDeployer, proxyManager)
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
	if userSessionTimeout == "" {
		userSessionTimeout = portainer.DefaultUserSessionTimeout
	}

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

func initDockerClientFactory(signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService) *dockerclient.ClientFactory {
	return dockerclient.NewClientFactory(signatureService, reverseTunnelService)
}

func initKubernetesClientFactory(signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService, dataStore dataservices.DataStore, instanceID, addrHTTPS, userSessionTimeout string) (*kubecli.ClientFactory, error) {
	return kubecli.NewClientFactory(signatureService, reverseTunnelService, dataStore, instanceID, addrHTTPS, userSessionTimeout)
}

func initSnapshotService(
	snapshotIntervalFromFlag string,
	dataStore dataservices.DataStore,
	dockerClientFactory *dockerclient.ClientFactory,
	kubernetesClientFactory *kubecli.ClientFactory,
	shutdownCtx context.Context,
) (portainer.SnapshotService, error) {
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

	return dataStore.SSLSettings().UpdateSettings(sslSettings)
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

	if flags.FeatureFlags != nil {
		featureflags.Parse(*flags.FeatureFlags, portainer.SupportedFeatureFlags)
	}

	fileService := initFileService(*flags.Data)
	encryptionKey := loadEncryptionSecretKey(*flags.SecretKeyName)
	if encryptionKey == nil {
		log.Info().Msg("proceeding without encryption key")
	}

	dataStore := initDataStore(flags, encryptionKey, fileService, shutdownCtx)

	if err := dataStore.CheckCurrentEdition(); err != nil {
		log.Fatal().Err(err).Msg("")
	}

	// check if the db schema version matches with server version
	if !checkDBSchemaServerVersionMatch(dataStore, portainer.APIVersion, int(portainer.Edition)) {
		log.Fatal().Msg("The database schema version does not align with the server version. Please consider reverting to the previous server version or addressing the database migration issue.")
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

	ldapService := initLDAPService()

	oauthService := initOAuthService()

	gitService := initGitService(shutdownCtx)

	openAMTService := openamt.NewService()

	cryptoService := initCryptoService()

	digitalSignatureService := initDigitalSignatureService()

	edgeStacksService := edgestacks.NewService(dataStore)

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

	reverseTunnelService := chisel.NewService(dataStore, shutdownCtx, fileService)

	dockerClientFactory := initDockerClientFactory(digitalSignatureService, reverseTunnelService)
	kubernetesClientFactory, err := initKubernetesClientFactory(digitalSignatureService, reverseTunnelService, dataStore, instanceID, *flags.AddrHTTPS, settings.UserSessionTimeout)

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

	composeDeployer, err := compose.NewComposeDeployer(*flags.Assets, dockerConfigPath)
	if err != nil {
		log.Fatal().Err(err).Msg("failed initializing compose deployer")
	}

	composeStackManager := initComposeStackManager(composeDeployer, proxyManager)

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

	// channel to control when the admin user is created
	adminCreationDone := make(chan struct{}, 1)

	go endpointutils.InitEndpoint(shutdownCtx, adminCreationDone, flags, dataStore, snapshotService)

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

			// notify the admin user is created, the endpoint initialization can start
			adminCreationDone <- struct{}{}
		} else {
			log.Info().Msg("instance already has an administrator user defined, skipping admin password related flags.")
		}
	}

	err = reverseTunnelService.StartTunnelServer(*flags.TunnelAddr, *flags.TunnelPort, snapshotService)
	if err != nil {
		log.Fatal().Err(err).Msg("failed starting tunnel server")
	}

	scheduler := scheduler.NewScheduler(shutdownCtx)
	stackDeployer := deployments.NewStackDeployer(swarmStackManager, composeStackManager, kubernetesDeployer, dockerClientFactory, dataStore)
	deployments.StartStackSchedules(scheduler, stackDeployer, dataStore, gitService)

	sslDBSettings, err := dataStore.SSLSettings().Settings()
	if err != nil {
		log.Fatal().Msg("failed to fetch SSL settings from DB")
	}

	upgradeService, err := upgrade.NewService(*flags.Assets, composeDeployer, kubernetesClientFactory)
	if err != nil {
		log.Fatal().Err(err).Msg("failed initializing upgrade service")
	}

	// Our normal migrations run as part of the database initialization
	// but some more complex migrations require access to a kubernetes or docker
	// client. Therefore we run a separate migration process just before
	// starting the server.
	postInitMigrator := datastore.NewPostInitMigrator(
		kubernetesClientFactory,
		dockerClientFactory,
		dataStore,
	)
	if err := postInitMigrator.PostInitMigrate(); err != nil {
		log.Fatal().Err(err).Msg("failure during post init migrations")
	}

	return &http.Server{
		AuthorizationService:        authorizationService,
		ReverseTunnelService:        reverseTunnelService,
		Status:                      applicationStatus,
		BindAddress:                 *flags.Addr,
		BindAddressHTTPS:            *flags.AddrHTTPS,
		HTTPEnabled:                 sslDBSettings.HTTPEnabled,
		AssetsPath:                  *flags.Assets,
		DataStore:                   dataStore,
		EdgeStacksService:           edgeStacksService,
		SwarmStackManager:           swarmStackManager,
		ComposeStackManager:         composeStackManager,
		KubernetesDeployer:          kubernetesDeployer,
		HelmPackageManager:          helmPackageManager,
		APIKeyService:               apiKeyService,
		CryptoService:               cryptoService,
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
		UpgradeService:              upgradeService,
		AdminCreationDone:           adminCreationDone,
	}
}

func main() {
	rand.Seed(time.Now().UnixNano())

	configureLogger()
	setLoggingMode("PRETTY")

	flags := initCLI()

	setLoggingLevel(*flags.LogLevel)
	setLoggingMode(*flags.LogMode)

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
