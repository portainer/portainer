package http

import (
	"context"
	"crypto/tls"
	"net/http"
	"path/filepath"
	"time"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/adminmonitor"
	"github.com/portainer/portainer/api/apikey"
	"github.com/portainer/portainer/api/crypto"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/docker"
	dockerclient "github.com/portainer/portainer/api/docker/client"
	"github.com/portainer/portainer/api/http/csrf"
	"github.com/portainer/portainer/api/http/handler"
	"github.com/portainer/portainer/api/http/handler/auth"
	"github.com/portainer/portainer/api/http/handler/backup"
	"github.com/portainer/portainer/api/http/handler/customtemplates"
	dockerhandler "github.com/portainer/portainer/api/http/handler/docker"
	"github.com/portainer/portainer/api/http/handler/edgegroups"
	"github.com/portainer/portainer/api/http/handler/edgejobs"
	"github.com/portainer/portainer/api/http/handler/edgestacks"
	"github.com/portainer/portainer/api/http/handler/endpointedge"
	"github.com/portainer/portainer/api/http/handler/endpointgroups"
	"github.com/portainer/portainer/api/http/handler/endpointproxy"
	"github.com/portainer/portainer/api/http/handler/endpoints"
	"github.com/portainer/portainer/api/http/handler/file"
	"github.com/portainer/portainer/api/http/handler/gitops"
	"github.com/portainer/portainer/api/http/handler/helm"
	"github.com/portainer/portainer/api/http/handler/hostmanagement/openamt"
	kubehandler "github.com/portainer/portainer/api/http/handler/kubernetes"
	"github.com/portainer/portainer/api/http/handler/ldap"
	"github.com/portainer/portainer/api/http/handler/motd"
	"github.com/portainer/portainer/api/http/handler/registries"
	"github.com/portainer/portainer/api/http/handler/resourcecontrols"
	"github.com/portainer/portainer/api/http/handler/roles"
	"github.com/portainer/portainer/api/http/handler/settings"
	sslhandler "github.com/portainer/portainer/api/http/handler/ssl"
	"github.com/portainer/portainer/api/http/handler/stacks"
	"github.com/portainer/portainer/api/http/handler/storybook"
	"github.com/portainer/portainer/api/http/handler/system"
	"github.com/portainer/portainer/api/http/handler/tags"
	"github.com/portainer/portainer/api/http/handler/teammemberships"
	"github.com/portainer/portainer/api/http/handler/teams"
	"github.com/portainer/portainer/api/http/handler/templates"
	"github.com/portainer/portainer/api/http/handler/upload"
	"github.com/portainer/portainer/api/http/handler/users"
	"github.com/portainer/portainer/api/http/handler/webhooks"
	"github.com/portainer/portainer/api/http/handler/websocket"
	"github.com/portainer/portainer/api/http/middlewares"
	"github.com/portainer/portainer/api/http/offlinegate"
	"github.com/portainer/portainer/api/http/proxy"
	"github.com/portainer/portainer/api/http/proxy/factory/kubernetes"
	"github.com/portainer/portainer/api/http/security"
	"github.com/portainer/portainer/api/internal/authorization"
	edgestackservice "github.com/portainer/portainer/api/internal/edge/edgestacks"
	"github.com/portainer/portainer/api/internal/snapshot"
	"github.com/portainer/portainer/api/internal/ssl"
	"github.com/portainer/portainer/api/internal/upgrade"
	k8s "github.com/portainer/portainer/api/kubernetes"
	"github.com/portainer/portainer/api/kubernetes/cli"
	"github.com/portainer/portainer/api/pendingactions"
	"github.com/portainer/portainer/api/platform"
	"github.com/portainer/portainer/api/scheduler"
	"github.com/portainer/portainer/api/stacks/deployments"
	libhelmtypes "github.com/portainer/portainer/pkg/libhelm/types"

	"github.com/rs/zerolog/log"
)

// Server implements the portainer.Server interface
type Server struct {
	AuthorizationService        *authorization.Service
	BindAddress                 string
	BindAddressHTTPS            string
	HTTPEnabled                 bool
	AssetsPath                  string
	Status                      *portainer.Status
	ReverseTunnelService        portainer.ReverseTunnelService
	ComposeStackManager         portainer.ComposeStackManager
	CryptoService               portainer.CryptoService
	EdgeStacksService           *edgestackservice.Service
	SignatureService            portainer.DigitalSignatureService
	SnapshotService             portainer.SnapshotService
	FileService                 portainer.FileService
	DataStore                   dataservices.DataStore
	GitService                  portainer.GitService
	OpenAMTService              portainer.OpenAMTService
	APIKeyService               apikey.APIKeyService
	JWTService                  portainer.JWTService
	LDAPService                 portainer.LDAPService
	OAuthService                portainer.OAuthService
	SwarmStackManager           portainer.SwarmStackManager
	ProxyManager                *proxy.Manager
	KubernetesTokenCacheManager *kubernetes.TokenCacheManager
	KubeClusterAccessService    k8s.KubeClusterAccessService
	Handler                     *handler.Handler
	SSLService                  *ssl.Service
	DockerClientFactory         *dockerclient.ClientFactory
	KubernetesClientFactory     *cli.ClientFactory
	KubernetesDeployer          portainer.KubernetesDeployer
	HelmPackageManager          libhelmtypes.HelmPackageManager
	Scheduler                   *scheduler.Scheduler
	ShutdownCtx                 context.Context
	ShutdownTrigger             context.CancelFunc
	StackDeployer               deployments.StackDeployer
	UpgradeService              upgrade.Service
	AdminCreationDone           chan struct{}
	PendingActionsService       *pendingactions.PendingActionsService
	PlatformService             platform.Service
	PullLimitCheckDisabled      bool
	TrustedOrigins              []string
}

// Start starts the HTTP server
func (server *Server) Start() error {
	kubernetesTokenCacheManager := server.KubernetesTokenCacheManager

	requestBouncer := security.NewRequestBouncer(server.DataStore, server.JWTService, server.APIKeyService)

	rateLimiter := security.NewRateLimiter(10, 1*time.Second, 1*time.Hour)
	offlineGate := offlinegate.NewOfflineGate()

	passwordStrengthChecker := security.NewPasswordStrengthChecker(server.DataStore.Settings())

	var authHandler = auth.NewHandler(requestBouncer, rateLimiter, passwordStrengthChecker)
	authHandler.DataStore = server.DataStore
	authHandler.CryptoService = server.CryptoService
	authHandler.JWTService = server.JWTService
	authHandler.LDAPService = server.LDAPService
	authHandler.ProxyManager = server.ProxyManager
	authHandler.KubernetesTokenCacheManager = kubernetesTokenCacheManager
	authHandler.OAuthService = server.OAuthService

	adminMonitor := adminmonitor.New(5*time.Minute, server.DataStore, server.ShutdownCtx)
	adminMonitor.Start()

	var backupHandler = backup.NewHandler(
		requestBouncer,
		server.DataStore,
		offlineGate,
		server.FileService.GetDatastorePath(),
		server.ShutdownTrigger,
		adminMonitor,
	)

	var roleHandler = roles.NewHandler(requestBouncer)
	roleHandler.DataStore = server.DataStore

	var customTemplatesHandler = customtemplates.NewHandler(requestBouncer, server.DataStore, server.FileService, server.GitService)

	var edgeGroupsHandler = edgegroups.NewHandler(requestBouncer)
	edgeGroupsHandler.DataStore = server.DataStore
	edgeGroupsHandler.ReverseTunnelService = server.ReverseTunnelService

	var edgeJobsHandler = edgejobs.NewHandler(requestBouncer)
	edgeJobsHandler.DataStore = server.DataStore
	edgeJobsHandler.FileService = server.FileService
	edgeJobsHandler.ReverseTunnelService = server.ReverseTunnelService

	var edgeStacksHandler = edgestacks.NewHandler(requestBouncer, server.DataStore, server.EdgeStacksService)
	edgeStacksHandler.FileService = server.FileService
	edgeStacksHandler.GitService = server.GitService
	edgeStacksHandler.KubernetesDeployer = server.KubernetesDeployer

	var endpointHandler = endpoints.NewHandler(requestBouncer)
	endpointHandler.DataStore = server.DataStore
	endpointHandler.FileService = server.FileService
	endpointHandler.ProxyManager = server.ProxyManager
	endpointHandler.SnapshotService = server.SnapshotService
	endpointHandler.K8sClientFactory = server.KubernetesClientFactory
	endpointHandler.DockerClientFactory = server.DockerClientFactory
	endpointHandler.ReverseTunnelService = server.ReverseTunnelService
	endpointHandler.ComposeStackManager = server.ComposeStackManager
	endpointHandler.AuthorizationService = server.AuthorizationService
	endpointHandler.BindAddress = server.BindAddress
	endpointHandler.BindAddressHTTPS = server.BindAddressHTTPS
	endpointHandler.PendingActionsService = server.PendingActionsService
	endpointHandler.PullLimitCheckDisabled = server.PullLimitCheckDisabled

	var endpointEdgeHandler = endpointedge.NewHandler(requestBouncer, server.DataStore, server.FileService, server.ReverseTunnelService)

	var endpointGroupHandler = endpointgroups.NewHandler(requestBouncer)
	endpointGroupHandler.AuthorizationService = server.AuthorizationService
	endpointGroupHandler.DataStore = server.DataStore
	endpointGroupHandler.PendingActionsService = server.PendingActionsService

	var endpointProxyHandler = endpointproxy.NewHandler(requestBouncer)
	endpointProxyHandler.DataStore = server.DataStore
	endpointProxyHandler.ProxyManager = server.ProxyManager
	endpointProxyHandler.ReverseTunnelService = server.ReverseTunnelService

	var kubernetesHandler = kubehandler.NewHandler(requestBouncer, server.AuthorizationService, server.DataStore, server.JWTService, server.KubeClusterAccessService, server.KubernetesClientFactory, nil)

	containerService := docker.NewContainerService(server.DockerClientFactory, server.DataStore)

	var dockerHandler = dockerhandler.NewHandler(requestBouncer, server.AuthorizationService, server.DataStore, server.DockerClientFactory, containerService)

	var fileHandler = file.NewHandler(filepath.Join(server.AssetsPath, "public"), adminMonitor.WasInstanceDisabled)

	var endpointHelmHandler = helm.NewHandler(requestBouncer, server.DataStore, server.JWTService, server.KubernetesDeployer, server.HelmPackageManager, server.KubeClusterAccessService)

	var gitOperationHandler = gitops.NewHandler(requestBouncer, server.DataStore, server.GitService, server.FileService)

	var helmTemplatesHandler = helm.NewTemplateHandler(requestBouncer, server.HelmPackageManager)

	var ldapHandler = ldap.NewHandler(requestBouncer)
	ldapHandler.DataStore = server.DataStore
	ldapHandler.FileService = server.FileService
	ldapHandler.LDAPService = server.LDAPService

	var motdHandler = motd.NewHandler(requestBouncer)

	var registryHandler = registries.NewHandler(requestBouncer)
	registryHandler.DataStore = server.DataStore
	registryHandler.FileService = server.FileService
	registryHandler.ProxyManager = server.ProxyManager
	registryHandler.K8sClientFactory = server.KubernetesClientFactory

	var resourceControlHandler = resourcecontrols.NewHandler(requestBouncer)
	resourceControlHandler.DataStore = server.DataStore

	var settingsHandler = settings.NewHandler(requestBouncer)
	settingsHandler.DataStore = server.DataStore
	settingsHandler.FileService = server.FileService
	settingsHandler.JWTService = server.JWTService
	settingsHandler.LDAPService = server.LDAPService
	settingsHandler.SnapshotService = server.SnapshotService

	var sslHandler = sslhandler.NewHandler(requestBouncer)
	sslHandler.SSLService = server.SSLService

	openAMTHandler := openamt.NewHandler(requestBouncer)
	openAMTHandler.OpenAMTService = server.OpenAMTService
	openAMTHandler.DataStore = server.DataStore
	openAMTHandler.DockerClientFactory = server.DockerClientFactory

	var stackHandler = stacks.NewHandler(requestBouncer)
	stackHandler.DataStore = server.DataStore
	stackHandler.DockerClientFactory = server.DockerClientFactory
	stackHandler.FileService = server.FileService
	stackHandler.KubernetesClientFactory = server.KubernetesClientFactory
	stackHandler.KubernetesDeployer = server.KubernetesDeployer
	stackHandler.GitService = server.GitService
	stackHandler.Scheduler = server.Scheduler
	stackHandler.SwarmStackManager = server.SwarmStackManager
	stackHandler.ComposeStackManager = server.ComposeStackManager
	stackHandler.StackDeployer = server.StackDeployer

	var storybookHandler = storybook.NewHandler(server.AssetsPath)

	var tagHandler = tags.NewHandler(requestBouncer)
	tagHandler.DataStore = server.DataStore

	var teamHandler = teams.NewHandler(requestBouncer)
	teamHandler.DataStore = server.DataStore

	var teamMembershipHandler = teammemberships.NewHandler(requestBouncer)
	teamMembershipHandler.DataStore = server.DataStore
	teamMembershipHandler.K8sClientFactory = server.KubernetesClientFactory

	var systemHandler = system.NewHandler(requestBouncer,
		server.Status,
		server.DataStore,
		server.PlatformService,
		server.UpgradeService)

	var templatesHandler = templates.NewHandler(requestBouncer)
	templatesHandler.DataStore = server.DataStore
	templatesHandler.FileService = server.FileService
	templatesHandler.GitService = server.GitService

	var uploadHandler = upload.NewHandler(requestBouncer)
	uploadHandler.FileService = server.FileService

	var userHandler = users.NewHandler(requestBouncer, rateLimiter, server.APIKeyService, passwordStrengthChecker)
	userHandler.DataStore = server.DataStore
	userHandler.CryptoService = server.CryptoService
	userHandler.AdminCreationDone = server.AdminCreationDone
	userHandler.FileService = server.FileService

	var websocketHandler = websocket.NewHandler(server.KubernetesTokenCacheManager, requestBouncer)
	websocketHandler.DataStore = server.DataStore
	websocketHandler.SignatureService = server.SignatureService
	websocketHandler.ReverseTunnelService = server.ReverseTunnelService
	websocketHandler.KubernetesClientFactory = server.KubernetesClientFactory

	var webhookHandler = webhooks.NewHandler(requestBouncer)
	webhookHandler.DataStore = server.DataStore
	webhookHandler.DockerClientFactory = server.DockerClientFactory

	server.Handler = &handler.Handler{
		RoleHandler:            roleHandler,
		AuthHandler:            authHandler,
		BackupHandler:          backupHandler,
		CustomTemplatesHandler: customTemplatesHandler,
		DockerHandler:          dockerHandler,
		EdgeGroupsHandler:      edgeGroupsHandler,
		EdgeJobsHandler:        edgeJobsHandler,
		EdgeStacksHandler:      edgeStacksHandler,
		EndpointGroupHandler:   endpointGroupHandler,
		EndpointHandler:        endpointHandler,
		EndpointHelmHandler:    endpointHelmHandler,
		EndpointEdgeHandler:    endpointEdgeHandler,
		EndpointProxyHandler:   endpointProxyHandler,
		GitOperationHandler:    gitOperationHandler,
		FileHandler:            fileHandler,
		LDAPHandler:            ldapHandler,
		HelmTemplatesHandler:   helmTemplatesHandler,
		KubernetesHandler:      kubernetesHandler,
		MOTDHandler:            motdHandler,
		OpenAMTHandler:         openAMTHandler,
		RegistryHandler:        registryHandler,
		ResourceControlHandler: resourceControlHandler,
		SettingsHandler:        settingsHandler,
		SSLHandler:             sslHandler,
		StackHandler:           stackHandler,
		StorybookHandler:       storybookHandler,
		SystemHandler:          systemHandler,
		TagHandler:             tagHandler,
		TeamHandler:            teamHandler,
		TeamMembershipHandler:  teamMembershipHandler,
		TemplatesHandler:       templatesHandler,
		UploadHandler:          uploadHandler,
		UserHandler:            userHandler,
		WebSocketHandler:       websocketHandler,
		WebhookHandler:         webhookHandler,
	}

	errorLogger := NewHTTPLogger()

	handler := adminMonitor.WithRedirect(offlineGate.WaitingMiddleware(time.Minute, server.Handler))

	handler = middlewares.WithPanicLogger(middlewares.WithSlowRequestsLogger(handler))

	handler, err := csrf.WithProtect(handler, server.TrustedOrigins)
	if err != nil {
		return errors.Wrap(err, "failed to create CSRF middleware")
	}

	if server.HTTPEnabled {
		go func() {
			log.Info().Str("bind_address", server.BindAddress).Msg("starting HTTP server")
			httpServer := &http.Server{
				Addr:     server.BindAddress,
				Handler:  middlewares.PlaintextHTTPRequest(handler),
				ErrorLog: errorLogger,
			}

			go shutdown(server.ShutdownCtx, httpServer)

			err := httpServer.ListenAndServe()
			if err != nil && err != http.ErrServerClosed {
				log.Error().Err(err).Msg("HTTP server failed to start")
			}
		}()
	}

	log.Info().Str("bind_address", server.BindAddressHTTPS).Msg("starting HTTPS server")
	httpsServer := &http.Server{
		Addr:         server.BindAddressHTTPS,
		Handler:      handler,
		ErrorLog:     errorLogger,
		TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler)), // Disable HTTP/2
	}

	httpsServer.TLSConfig = crypto.CreateTLSConfiguration()
	httpsServer.TLSConfig.GetCertificate = func(*tls.ClientHelloInfo) (*tls.Certificate, error) {
		return server.SSLService.GetRawCertificate(), nil
	}

	go shutdown(server.ShutdownCtx, httpsServer)
	go snapshot.NewBackgroundSnapshotter(server.DataStore, server.ReverseTunnelService)

	return httpsServer.ListenAndServeTLS("", "")
}

func shutdown(shutdownCtx context.Context, httpServer *http.Server) {
	<-shutdownCtx.Done()

	log.Debug().Msg("shutting down the HTTP server")
	shutdownTimeout, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	err := httpServer.Shutdown(shutdownTimeout)
	if err != nil {
		log.Error().
			Err(err).
			Msg("failed to shut down the HTTP server")
	}
}
