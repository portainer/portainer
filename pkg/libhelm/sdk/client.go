package sdk

import (
	"github.com/pkg/errors"
	"github.com/portainer/portainer/pkg/libhelm/options"
	"github.com/rs/zerolog/log"
	slogzerolog "github.com/samber/slog-zerolog/v2"
	"helm.sh/helm/v4/pkg/action"
	"helm.sh/helm/v4/pkg/cli"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/discovery/cached/memory"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/restmapper"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/tools/clientcmd/api"
)

// newRESTClientGetter creates a custom RESTClientGetter using the provided client config
type clientConfigGetter struct {
	clientConfig clientcmd.ClientConfig
	namespace    string
}

// namespaceOrDefault returns "default" for an empty namespace. Actions that
// operate on a single release pass their namespace through this before calling
// initActionConfig, so an omitted namespace resolves to "default" rather than
// initializing the release storage cluster-wide.
func namespaceOrDefault(namespace string) string {
	if namespace == "" {
		return "default"
	}
	return namespace
}

// initActionConfig initializes the action configuration scoped to the given
// namespace, which may be empty: an empty namespace initializes the release
// storage cluster-wide, which is how `helm list --all-namespaces` sees
// releases in every namespace (action.List.AllNamespaces alone does not widen
// the storage scope).
func (hspm *HelmSDKPackageManager) initActionConfig(actionConfig *action.Configuration, namespace string, k8sAccess *options.KubernetesClusterAccess) error {
	// Setup logging for Helm SDK using zerolog
	logger := log.With().Str("context", "HelmClient").Logger()
	logOptions := slogzerolog.Option{
		Logger: &(logger),
	}
	actionConfig.SetLogger(logOptions.NewZerologHandler())

	if k8sAccess == nil {
		// Use default kubeconfig
		settings := cli.New()
		clientGetter := settings.RESTClientGetter()
		return actionConfig.Init(clientGetter, namespace, "secret")
	}

	// Create client config
	configAPI := generateConfigAPI(namespace, k8sAccess)
	clientConfig := clientcmd.NewDefaultClientConfig(*configAPI, &clientcmd.ConfigOverrides{})

	// Create a custom RESTClientGetter that uses our in-memory config
	clientGetter, err := newRESTClientGetter(clientConfig, namespace)
	if err != nil {
		log.Error().
			Str("context", "HelmClient").
			Str("cluster_name", k8sAccess.ClusterName).
			Str("cluster_url", k8sAccess.ClusterServerURL).
			Str("user_name", k8sAccess.UserName).
			Err(err).
			Msg("failed to create client getter")
		return err
	}

	return actionConfig.Init(clientGetter, namespace, "secret")
}

// generateConfigAPI generates a new kubeconfig configuration
func generateConfigAPI(namespace string, k8sAccess *options.KubernetesClusterAccess) *api.Config {
	// Create in-memory kubeconfig configuration
	configAPI := api.NewConfig()

	// Create cluster
	cluster := api.NewCluster()
	cluster.Server = k8sAccess.ClusterServerURL

	if k8sAccess.CertificateAuthorityFile != "" {
		// If we have a CA file, use it
		cluster.CertificateAuthority = k8sAccess.CertificateAuthorityFile
	} else {
		// Otherwise skip TLS verification
		cluster.InsecureSkipTLSVerify = true
	}

	// Create auth info with token
	authInfo := api.NewAuthInfo()
	authInfo.Token = k8sAccess.AuthToken

	// Create context
	context := api.NewContext()
	context.Cluster = k8sAccess.ClusterName
	context.AuthInfo = k8sAccess.UserName
	context.Namespace = namespace

	// Add to config
	configAPI.Clusters[k8sAccess.ClusterName] = cluster
	configAPI.AuthInfos[k8sAccess.UserName] = authInfo
	configAPI.Contexts[k8sAccess.ContextName] = context
	configAPI.CurrentContext = k8sAccess.ContextName

	return configAPI
}

func newRESTClientGetter(clientConfig clientcmd.ClientConfig, namespace string) (*clientConfigGetter, error) {
	if clientConfig == nil {
		log.Error().
			Str("context", "HelmClient").
			Msg("client config is nil")

		return nil, errors.New("client config provided during the helm client initialization was nil. Check the kubernetes cluster access configuration")
	}

	return &clientConfigGetter{
		clientConfig: clientConfig,
		namespace:    namespace,
	}, nil
}

func (c *clientConfigGetter) ToRESTConfig() (*rest.Config, error) {
	if c.clientConfig == nil {
		log.Error().
			Str("context", "HelmClient").
			Msg("client config is nil")

		return nil, errors.New("client config provided during the helm client initialization was nil. Check the kubernetes cluster access configuration")
	}

	return c.clientConfig.ClientConfig()
}

func (c *clientConfigGetter) ToDiscoveryClient() (discovery.CachedDiscoveryInterface, error) {
	config, err := c.ToRESTConfig()
	if err != nil {
		return nil, err
	}

	// Create the discovery client
	discoveryClient, err := discovery.NewDiscoveryClientForConfig(config)
	if err != nil {
		return nil, err
	}

	// Wrap the discovery client with a cached discovery client
	return memory.NewMemCacheClient(discoveryClient), nil
}

func (c *clientConfigGetter) ToRESTMapper() (meta.RESTMapper, error) {
	discoveryClient, err := c.ToDiscoveryClient()
	if err != nil {
		return nil, err
	}

	// Create a REST mapper from the discovery client
	return restmapper.NewDeferredDiscoveryRESTMapper(discoveryClient), nil
}

func (c *clientConfigGetter) ToRawKubeConfigLoader() clientcmd.ClientConfig {
	return c.clientConfig
}
