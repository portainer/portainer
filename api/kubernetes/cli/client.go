package cli

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/rs/zerolog/log"

	"github.com/patrickmn/go-cache"
	"github.com/pkg/errors"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	metricsv "k8s.io/metrics/pkg/client/clientset/versioned"
)

const (
	defaultKubeClientQPS   = 30
	defaultKubeClientBurst = 100
	maxConcurrency         = 30
)

type (
	// ClientFactory is used to create Kubernetes clients
	ClientFactory struct {
		dataStore            dataservices.DataStore
		reverseTunnelService portainer.ReverseTunnelService
		signatureService     portainer.DigitalSignatureService
		instanceID           string
		endpointProxyClients *cache.Cache
		AddrHTTPS            string
	}

	// KubeClient represent a service used to execute Kubernetes operations
	KubeClient struct {
		cli                kubernetes.Interface
		instanceID         string
		mu                 sync.Mutex
		IsKubeAdmin        bool
		NonAdminNamespaces []string
	}
)

func NewKubeClientFromClientset(cli *kubernetes.Clientset) *KubeClient {
	return &KubeClient{
		cli:        cli,
		instanceID: "",
	}
}

// NewClientFactory returns a new instance of a ClientFactory
func NewClientFactory(signatureService portainer.DigitalSignatureService, reverseTunnelService portainer.ReverseTunnelService, dataStore dataservices.DataStore, instanceID, addrHTTPS, userSessionTimeout string) (*ClientFactory, error) {
	if userSessionTimeout == "" {
		userSessionTimeout = portainer.DefaultUserSessionTimeout
	}
	timeout, err := time.ParseDuration(userSessionTimeout)
	if err != nil {
		return nil, err
	}

	return &ClientFactory{
		dataStore:            dataStore,
		signatureService:     signatureService,
		reverseTunnelService: reverseTunnelService,
		instanceID:           instanceID,
		endpointProxyClients: cache.New(timeout, timeout),
		AddrHTTPS:            addrHTTPS,
	}, nil
}

func (factory *ClientFactory) GetInstanceID() (instanceID string) {
	return factory.instanceID
}

// Clear removes all cached kube clients
func (factory *ClientFactory) ClearClientCache() {
	log.Debug().Msgf("kubernetes namespace permissions have changed, clearing the client cache")
	factory.endpointProxyClients.Flush()
}

// Remove the cached kube client so a new one can be created
func (factory *ClientFactory) RemoveKubeClient(endpointID portainer.EndpointID) {
	factory.endpointProxyClients.Delete(strconv.Itoa(int(endpointID)))
}

// GetPrivilegedKubeClient checks if an existing client is already registered for the environment(endpoint) and returns it if one is found.
// If no client is registered, it will create a new client, register it, and returns it.
func (factory *ClientFactory) GetPrivilegedKubeClient(endpoint *portainer.Endpoint) (*KubeClient, error) {
	key := strconv.Itoa(int(endpoint.ID))
	pcl, ok := factory.endpointProxyClients.Get(key)
	if ok {
		return pcl.(*KubeClient), nil
	}

	kcl, err := factory.createCachedPrivilegedKubeClient(endpoint)
	if err != nil {
		return nil, err
	}

	factory.endpointProxyClients.Set(key, kcl, cache.DefaultExpiration)
	return kcl, nil
}

// GetProxyKubeClient retrieves a KubeClient from the cache. You should be
// calling SetProxyKubeClient before first. It is normally, called the
// kubernetes middleware.
func (factory *ClientFactory) GetProxyKubeClient(endpointID, userID string) (*KubeClient, bool) {
	client, ok := factory.endpointProxyClients.Get(endpointID + "." + userID)
	if ok {
		return client.(*KubeClient), true
	}
	return nil, false
}

// SetProxyKubeClient stores a kubeclient in the cache.
func (factory *ClientFactory) SetProxyKubeClient(endpointID, userID string, cli *KubeClient) {
	factory.endpointProxyClients.Set(endpointID+"."+userID, cli, cache.DefaultExpiration)
}

// CreateKubeClientFromKubeConfig creates a KubeClient from a clusterID, and
// Kubernetes config.
func (factory *ClientFactory) CreateKubeClientFromKubeConfig(clusterID string, kubeConfig []byte, IsKubeAdmin bool, NonAdminNamespaces []string) (*KubeClient, error) {
	config, err := clientcmd.NewClientConfigFromBytes(kubeConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create a client config from kubeconfig: %w", err)
	}

	clientConfig, err := config.ClientConfig()
	if err != nil {
		return nil, fmt.Errorf("failed to get the complete client config from kubeconfig: %w", err)
	}

	clientConfig.QPS = defaultKubeClientQPS
	clientConfig.Burst = defaultKubeClientBurst

	cli, err := kubernetes.NewForConfig(clientConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create a new clientset for the given config: %w", err)
	}

	return &KubeClient{
		cli:                cli,
		instanceID:         factory.instanceID,
		IsKubeAdmin:        IsKubeAdmin,
		NonAdminNamespaces: NonAdminNamespaces,
	}, nil
}

func (factory *ClientFactory) createCachedPrivilegedKubeClient(endpoint *portainer.Endpoint) (*KubeClient, error) {
	cli, err := factory.CreateClient(endpoint)
	if err != nil {
		return nil, err
	}

	return &KubeClient{
		cli:        cli,
		instanceID: factory.instanceID,
	}, nil
}

// CreateClient returns a pointer to a new Clientset instance.
func (factory *ClientFactory) CreateClient(endpoint *portainer.Endpoint) (*kubernetes.Clientset, error) {
	switch endpoint.Type {
	case portainer.KubernetesLocalEnvironment, portainer.AgentOnKubernetesEnvironment, portainer.EdgeAgentOnKubernetesEnvironment:
		c, err := factory.CreateConfig(endpoint)
		if err != nil {
			return nil, err
		}
		return kubernetes.NewForConfig(c)
	}
	return nil, errors.New("unsupported environment type")
}

// CreateConfig returns a pointer to a new kubeconfig ready to create a client.
func (factory *ClientFactory) CreateConfig(endpoint *portainer.Endpoint) (*rest.Config, error) {
	switch endpoint.Type {
	case portainer.KubernetesLocalEnvironment:
		return buildLocalConfig()
	case portainer.AgentOnKubernetesEnvironment:
		return factory.buildAgentConfig(endpoint)
	case portainer.EdgeAgentOnKubernetesEnvironment:
		return factory.buildEdgeConfig(endpoint)
	}
	return nil, errors.New("unsupported environment type")
}

type agentHeaderRoundTripper struct {
	signatureHeader string
	publicKeyHeader string

	roundTripper http.RoundTripper
}

// RoundTrip is the implementation of the http.RoundTripper interface.
// It decorates the request with specific agent headers
func (rt *agentHeaderRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	req.Header.Add(portainer.PortainerAgentPublicKeyHeader, rt.publicKeyHeader)
	req.Header.Add(portainer.PortainerAgentSignatureHeader, rt.signatureHeader)

	return rt.roundTripper.RoundTrip(req)
}

func (factory *ClientFactory) buildAgentConfig(endpoint *portainer.Endpoint) (*rest.Config, error) {
	var clientURL strings.Builder
	if !strings.HasPrefix(endpoint.URL, "http") {
		clientURL.WriteString("https://")
	}
	clientURL.WriteString(endpoint.URL)
	clientURL.WriteString("/kubernetes")

	signature, err := factory.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	config, err := clientcmd.BuildConfigFromFlags(clientURL.String(), "")
	if err != nil {
		return nil, err
	}

	config.Insecure = true
	config.QPS = defaultKubeClientQPS
	config.Burst = defaultKubeClientBurst

	config.Wrap(func(rt http.RoundTripper) http.RoundTripper {
		return &agentHeaderRoundTripper{
			signatureHeader: signature,
			publicKeyHeader: factory.signatureService.EncodedPublicKey(),
			roundTripper:    rt,
		}
	})
	return config, nil
}

func (factory *ClientFactory) buildEdgeConfig(endpoint *portainer.Endpoint) (*rest.Config, error) {
	tunnelAddr, err := factory.reverseTunnelService.TunnelAddr(endpoint)
	if err != nil {
		return nil, errors.Wrap(err, "failed to activate the chisel reverse tunnel. check if the tunnel port is open at the portainer instance")
	}
	endpointURL := fmt.Sprintf("http://%s/kubernetes", tunnelAddr)

	config, err := clientcmd.BuildConfigFromFlags(endpointURL, "")
	if err != nil {
		return nil, err
	}

	signature, err := factory.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	config.Insecure = true
	config.QPS = defaultKubeClientQPS
	config.Burst = defaultKubeClientBurst

	config.Wrap(func(rt http.RoundTripper) http.RoundTripper {
		return &agentHeaderRoundTripper{
			signatureHeader: signature,
			publicKeyHeader: factory.signatureService.EncodedPublicKey(),
			roundTripper:    rt,
		}
	})

	return config, nil
}

func (factory *ClientFactory) CreateRemoteMetricsClient(endpoint *portainer.Endpoint) (*metricsv.Clientset, error) {
	config, err := factory.CreateConfig(endpoint)
	if err != nil {
		return nil, fmt.Errorf("failed to create metrics KubeConfig")
	}
	return metricsv.NewForConfig(config)
}

func buildLocalConfig() (*rest.Config, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, err
	}

	config.QPS = defaultKubeClientQPS
	config.Burst = defaultKubeClientBurst

	return config, nil
}

func (factory *ClientFactory) MigrateEndpointIngresses(e *portainer.Endpoint, datastore dataservices.DataStore, cli *KubeClient) error {
	return datastore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		environment, err := tx.Endpoint().Endpoint(e.ID)
		if err != nil {
			log.Error().Err(err).Msgf("Error retrieving environment %d", e.ID)
			return err
		}

		// classes is a list of controllers which have been manually added to the
		// cluster setup view. These need to all be allowed globally, but then
		// blocked in specific namespaces which they were not previously allowed in.
		classes := environment.Kubernetes.Configuration.IngressClasses

		// In pre-2.16 versions of portainer, the namespace level permissions were stored by
		// creating an actual ingress rule in the cluster with a particular
		// annotation indicating that it's name (the class name) should be allowed.
		detected, err := cli.GetIngressControllers()
		if err != nil {
			log.Error().Err(err).Msgf("Error getting ingress controllers in environment %d", environment.ID)
			return err
		}

		// newControllers is a set of all currently detected controllers.
		newControllers := make(map[string]struct{})
		for _, controller := range detected {
			newControllers[controller.ClassName] = struct{}{}
		}

		namespaces, err := cli.GetNamespaces()
		if err != nil {
			log.Error().Err(err).Msgf("Error getting namespaces in environment %d", environment.ID)
			return err
		}

		// Set of namespaces, if any, in which "allow none" should be true.
		allow := make(map[string]map[string]struct{})
		for _, c := range classes {
			allow[c.Name] = make(map[string]struct{})
		}
		allow["none"] = make(map[string]struct{})

		for namespace := range namespaces {
			// Compare old annotations with currently detected controllers.
			ingresses, err := cli.GetIngresses(namespace)
			if err != nil {
				log.Error().Err(err).Msgf("Error getting ingresses in environment %d", environment.ID)
				return err
			}
			for _, ingress := range ingresses {
				oldController, ok := ingress.Annotations["ingress.portainer.io/ingress-type"]
				if !ok {
					// Skip rules without our old annotation.
					continue
				}

				if _, ok := newControllers[oldController]; ok {
					// Skip rules which match a detected controller.
					// TODO: Allow this particular controller.
					allow[oldController][ingress.Namespace] = struct{}{}
					continue
				}

				allow["none"][ingress.Namespace] = struct{}{}
			}
		}

		// Locally, disable "allow none" for namespaces not inside shouldAllowNone.
		var newClasses []portainer.KubernetesIngressClassConfig
		for _, c := range classes {
			var blocked []string
			for namespace := range namespaces {
				if _, ok := allow[c.Name][namespace]; ok {
					continue
				}
				blocked = append(blocked, namespace)
			}

			newClasses = append(newClasses, portainer.KubernetesIngressClassConfig{
				Name:              c.Name,
				Type:              c.Type,
				GloballyBlocked:   false,
				BlockedNamespaces: blocked,
			})
		}

		// Handle "none".
		if len(allow["none"]) != 0 {
			environment.Kubernetes.Configuration.AllowNoneIngressClass = true
			var disallowNone []string
			for namespace := range namespaces {
				if _, ok := allow["none"][namespace]; ok {
					continue
				}
				disallowNone = append(disallowNone, namespace)
			}
			newClasses = append(newClasses, portainer.KubernetesIngressClassConfig{
				Name:              "none",
				Type:              "custom",
				GloballyBlocked:   false,
				BlockedNamespaces: disallowNone,
			})
		}

		environment.Kubernetes.Configuration.IngressClasses = newClasses
		environment.PostInitMigrations.MigrateIngresses = false
		return tx.Endpoint().UpdateEndpoint(environment.ID, environment)
	})
}
