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

	"github.com/patrickmn/go-cache"
	"github.com/pkg/errors"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	metricsv "k8s.io/metrics/pkg/client/clientset/versioned"
)

const (
	DefaultKubeClientQPS   = 30
	DefaultKubeClientBurst = 100
)

type (
	// ClientFactory is used to create Kubernetes clients
	ClientFactory struct {
		dataStore            dataservices.DataStore
		reverseTunnelService portainer.ReverseTunnelService
		signatureService     portainer.DigitalSignatureService
		instanceID           string
		endpointClients      map[string]*KubeClient
		endpointProxyClients *cache.Cache
		AddrHTTPS            string
		mu                   sync.Mutex
	}

	// KubeClient represent a service used to execute Kubernetes operations
	KubeClient struct {
		cli        kubernetes.Interface
		instanceID string
		mu         sync.Mutex
	}
)

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
		endpointClients:      make(map[string]*KubeClient),
		endpointProxyClients: cache.New(timeout, timeout),
		AddrHTTPS:            addrHTTPS,
	}, nil
}

func (factory *ClientFactory) GetInstanceID() (instanceID string) {
	return factory.instanceID
}

// Remove the cached kube client so a new one can be created
func (factory *ClientFactory) RemoveKubeClient(endpointID portainer.EndpointID) {
	factory.mu.Lock()
	delete(factory.endpointClients, strconv.Itoa(int(endpointID)))
	factory.mu.Unlock()
}

// GetKubeClient checks if an existing client is already registered for the environment(endpoint) and returns it if one is found.
// If no client is registered, it will create a new client, register it, and returns it.
func (factory *ClientFactory) GetKubeClient(endpoint *portainer.Endpoint) (*KubeClient, error) {
	factory.mu.Lock()
	defer factory.mu.Unlock()

	key := strconv.Itoa(int(endpoint.ID))
	client, ok := factory.endpointClients[key]
	if !ok {
		var err error

		client, err = factory.createCachedAdminKubeClient(endpoint)
		if err != nil {
			return nil, err
		}

		factory.endpointClients[key] = client
	}

	return client, nil
}

// GetProxyKubeClient retrieves a KubeClient from the cache. You should be
// calling SetProxyKubeClient before first. It is normally, called the
// kubernetes middleware.
func (factory *ClientFactory) GetProxyKubeClient(endpointID, token string) (*KubeClient, bool) {
	client, ok := factory.endpointProxyClients.Get(endpointID + "." + token)
	if !ok {
		return nil, false
	}

	return client.(*KubeClient), true
}

// SetProxyKubeClient stores a kubeclient in the cache.
func (factory *ClientFactory) SetProxyKubeClient(endpointID, token string, cli *KubeClient) {
	factory.endpointProxyClients.Set(endpointID+"."+token, cli, 0)
}

// CreateKubeClientFromKubeConfig creates a KubeClient from a clusterID, and
// Kubernetes config.
func (factory *ClientFactory) CreateKubeClientFromKubeConfig(clusterID string, kubeConfig []byte) (*KubeClient, error) {
	config, err := clientcmd.NewClientConfigFromBytes(kubeConfig)
	if err != nil {
		return nil, err
	}

	cliConfig, err := config.ClientConfig()
	if err != nil {
		return nil, err
	}

	cliConfig.QPS = DefaultKubeClientQPS
	cliConfig.Burst = DefaultKubeClientBurst

	cli, err := kubernetes.NewForConfig(cliConfig)
	if err != nil {
		return nil, err
	}

	return &KubeClient{
		cli:        cli,
		instanceID: factory.instanceID,
	}, nil
}

func (factory *ClientFactory) createCachedAdminKubeClient(endpoint *portainer.Endpoint) (*KubeClient, error) {
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
	config.QPS = DefaultKubeClientQPS
	config.Burst = DefaultKubeClientBurst

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
	tunnel, err := factory.reverseTunnelService.GetActiveTunnel(endpoint)
	if err != nil {
		return nil, errors.Wrap(err, "failed activating tunnel")
	}
	endpointURL := fmt.Sprintf("http://127.0.0.1:%d/kubernetes", tunnel.Port)

	config, err := clientcmd.BuildConfigFromFlags(endpointURL, "")
	if err != nil {
		return nil, err
	}

	signature, err := factory.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	config.Insecure = true
	config.QPS = DefaultKubeClientQPS
	config.Burst = DefaultKubeClientBurst

	config.Wrap(func(rt http.RoundTripper) http.RoundTripper {
		return &agentHeaderRoundTripper{
			signatureHeader: signature,
			publicKeyHeader: factory.signatureService.EncodedPublicKey(),
			roundTripper:    rt,
		}
	})

	return config, nil
}

func (factory *ClientFactory) createRemoteClient(endpointURL string) (*kubernetes.Clientset, error) {
	signature, err := factory.signatureService.CreateSignature(portainer.PortainerAgentSignatureMessage)
	if err != nil {
		return nil, err
	}

	config, err := clientcmd.BuildConfigFromFlags(endpointURL, "")
	if err != nil {
		return nil, err
	}

	config.Insecure = true
	config.QPS = DefaultKubeClientQPS
	config.Burst = DefaultKubeClientBurst

	config.Wrap(func(rt http.RoundTripper) http.RoundTripper {
		return &agentHeaderRoundTripper{
			signatureHeader: signature,
			publicKeyHeader: factory.signatureService.EncodedPublicKey(),
			roundTripper:    rt,
		}
	})

	return kubernetes.NewForConfig(config)
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

	config.QPS = DefaultKubeClientQPS
	config.Burst = DefaultKubeClientBurst

	return config, nil
}

func (factory *ClientFactory) MigrateEndpointIngresses(e *portainer.Endpoint) error {
	// classes is a list of controllers which have been manually added to the
	// cluster setup view. These need to all be allowed globally, but then
	// blocked in specific namespaces which they were not previously allowed in.
	classes := e.Kubernetes.Configuration.IngressClasses

	// We need a kube client to gather namespace level permissions. In pre-2.16
	// versions of portainer, the namespace level permissions were stored by
	// creating an actual ingress rule in the cluster with a particular
	// annotation indicating that it's name (the class name) should be allowed.
	cli, err := factory.GetKubeClient(e)
	if err != nil {
		return err
	}

	detected, err := cli.GetIngressControllers()
	if err != nil {
		return err
	}

	// newControllers is a set of all currently detected controllers.
	newControllers := make(map[string]struct{})
	for _, controller := range detected {
		newControllers[controller.ClassName] = struct{}{}
	}

	namespaces, err := cli.GetNamespaces()
	if err != nil {
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
			return fmt.Errorf("failure getting ingresses during migration")
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
		e.Kubernetes.Configuration.AllowNoneIngressClass = true
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

	e.Kubernetes.Configuration.IngressClasses = newClasses
	e.PostInitMigrations.MigrateIngresses = false
	return factory.dataStore.Endpoint().UpdateEndpoint(e.ID, e)
}
