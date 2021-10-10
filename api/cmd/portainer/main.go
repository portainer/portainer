package main

import (
	"context"
	"log"
	"os"
	"strings"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/bolt"
	"github.com/portainer/portainer/api/chisel"
	"github.com/portainer/portainer/api/cli"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/docker"

	"github.com/portainer/libhelm"
	"github.com/portainer/portainer/api/exec"
	"github.com/portainer/portainer/api/filesystem"
	"github.com/portainer/portainer/api/git"
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

func initDataStore(dataStorePath string, rollback bool, fileService portainer.FileService, shutdownCtx context.Context) portainer.DataStore {
	store := bolt.NewStore(dataStorePath, fileService)
	err := store.Open()
	if err != nil {
		log.Fatalf("failed opening store: %v", err)
	}

	if rollback {
		err := store.Rollback(false)
		if err != nil {
			log.Fatalf("failed rolling back: %s", err)
		}

		log.Println("Exiting rollback")
		os.Exit(0)
		return nil
	}

	err = store.Init()
	if err != nil {
		log.Fatalf("failed initializing data store: %v", err)
	}

	err = store.MigrateData(false)
	if err != nil {
		log.Fatalf("failed migration: %v", err)
	}

	go shutdownDatastore(shutdownCtx, store)
	return store
}

func shutdownDatastore(shutdownCtx context.Context, datastore portainer.DataStore) {
	<-shutdownCtx.Done()
	datastore.Close()
}

func initComposeStackManager(assetsPath string, configPath string, reverseTunnelService portainer.ReverseTunnelService, proxyManager *proxy.Manager) portainer.ComposeStackManager {
	composeWrapper, err := exec.NewComposeStackManager(assetsPath, configPath, proxyManager)
	if err != nil {
		log.Fatalf("failed creating compose manager: %s", err)
	}

	return composeWrapper
}

func initSwarmStackManager(assetsPath string, configPath string, signatureService portainer.DigitalSignatureService, fileService portainer.FileService, reverseTunnelService portainer.ReverseTunnelService) (portainer.SwarmStackManager, error) {
	return exec.NewSwarmStackManager(assetsPath, configPath, signatureService, fileService, reverseTunnelService)
}

func initKubernetesDeployer(kubernetesTokenCacheManager *kubeproxy.TokenCacheManager, kubernetesClientFactory *kubecli.ClientFactory, dataStore portainer.DataStore, reverseTunnelService portainer.ReverseTunnelService, signatureService portainer.DigitalSignatureService, proxyManager *proxy.Manager, assetsPath string) portainer.KubernetesDeployer {
	return exec.NewKubernetesDeployer(kubernetesTokenCacheManager, kubernetesClientFactory, dataStore, reverseTunnelService, signatureService, proxyManager, assetsPath)
}

func initHelmPackageManager(assetsPath string) (libhelm.HelmPackageManager, error) {
	return libhelm.NewHelmPackageManager(libhelm.HelmConfig{BinaryPath: assetsPath})
}

func initJWTService(dataStore portainer.DataStore) (portainer.JWTService, error) {
	settings, err := dataStore.Settings().Settings()
	if err != nil {
		return nil, err
	}

	if settings.UserSessionTimeout == "" {
		settings.UserSessionTimeout = portainer.DefaultUserSessionTimeout
		dataStore.Settings().UpdateSettings(settings)
	}
	jwtService, err := jwt.NewService(settings.UserSessionTimeout, dataStore)
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

func initSSLService(addr, dataPath, certPath, keyPath string, fileService portainer.FileService, dataStore portainer.DataStore, shutdownTrigger context.CancelFunc) (*ssl.Service, error) {
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

func initKubernetesClientFactory(signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService, instanceID string, dataStore portainer.DataStore) *kubecli.ClientFactory {
	return kubecli.NewClientFactory(signatureService, reverseTunnelService, instanceID, dataStore)
}

func initSnapshotService(snapshotInterval string, dataStore portainer.DataStore, dockerClientFactory *docker.ClientFactory, kubernetesClientFactory *kubecli.ClientFactory, shutdownCtx context.Context) (portainer.SnapshotService, error) {
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

func updateSettingsFromFlags(dataStore portainer.DataStore, flags *portainer.CLIFlags) error {
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

	httpEnabled := !*flags.HTTPDisabled

	sslSettings, err := dataStore.SSLSettings().Settings()
	if err != nil {
		return err
	}

	sslSettings.HTTPEnabled = httpEnabled

	err = dataStore.SSLSettings().UpdateSettings(sslSettings)
	if err != nil {
		return err
	}

	return nil
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

func createTLSSecuredEndpoint(flags *portainer.CLIFlags, dataStore portainer.DataStore, snapshotService portainer.SnapshotService) error {
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

	return dataStore.Endpoint().CreateEndpoint(endpoint)
}

func createUnsecuredEndpoint(endpointURL string, dataStore portainer.DataStore, snapshotService portainer.SnapshotService) error {
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

	return dataStore.Endpoint().CreateEndpoint(endpoint)
}

func initEndpoint(flags *portainer.CLIFlags, dataStore portainer.DataStore, snapshotService portainer.SnapshotService) error {
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

	dataStore := initDataStore(*flags.Data, *flags.Rollback, fileService, shutdownCtx)

	if err := dataStore.CheckCurrentEdition(); err != nil {
		log.Fatal(err)
	}

	jwtService, err := initJWTService(dataStore)
	if err != nil {
		log.Fatalf("failed initializing JWT service: %v", err)
	}

	ldapService := initLDAPService()

	oauthService := initOAuthService()

	gitService := initGitService()

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
		log.Fatalf("failed initializing key pai: %v", err)
	}

	reverseTunnelService := chisel.NewService(dataStore, shutdownCtx)

	instanceID, err := dataStore.Version().InstanceID()
	if err != nil {
		log.Fatalf("failed getting instance id: %v", err)
	}

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

	dockerConfigPath := fileService.GetDockerConfigPath()

	composeStackManager := initComposeStackManager(*flags.Assets, dockerConfigPath, reverseTunnelService, proxyManager)

	swarmStackManager, err := initSwarmStackManager(*flags.Assets, dockerConfigPath, digitalSignatureService, fileService, reverseTunnelService)
	if err != nil {
		log.Fatalf("failed initializing swarm stack manager: %s", err)
	}

	kubernetesDeployer := initKubernetesDeployer(kubernetesTokenCacheManager, kubernetesClientFactory, dataStore, reverseTunnelService, digitalSignatureService, proxyManager, *flags.Assets)

	helmPackageManager, err := initHelmPackageManager(*flags.Assets)
	if err != nil {
		log.Fatalf("failed initializing helm package manager: %s", err)
	}

	if dataStore.IsNew() {
		err = updateSettingsFromFlags(dataStore, flags)
		if err != nil {
			log.Fatalf("failed updating settings from flags: %v", err)
		}
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
		content, err := fileService.GetFileContent(*flags.AdminPasswordFile)
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
			err := dataStore.User().CreateUser(user)
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
		JWTService:                  jwtService,
		FileService:                 fileService,
		LDAPService:                 ldapService,
		OAuthService:                oauthService,
		GitService:                  gitService,
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
