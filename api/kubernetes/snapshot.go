package kubernetes

import (
	"log"
	"time"

	portainer "github.com/portainer/portainer/api"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type Snapshotter struct {
	clientFactory *ClientFactory
}

// NewSnapshotter returns a new Snapshotter instance
func NewSnapshotter(clientFactory *ClientFactory) *Snapshotter {
	return &Snapshotter{
		clientFactory: clientFactory,
	}
}

// CreateSnapshot creates a snapshot of a specific Kubernetes endpoint
func (snapshotter *Snapshotter) CreateSnapshot(endpoint *portainer.Endpoint) (*portainer.KubernetesSnapshot, error) {
	cli, err := snapshotter.clientFactory.CreateClient(endpoint)
	if err != nil {
		return nil, err
	}

	return snapshot(cli, endpoint)
}

func snapshot(cli *kubernetes.Clientset, endpoint *portainer.Endpoint) (*portainer.KubernetesSnapshot, error) {
	res := cli.RESTClient().Get().AbsPath("/healthz").Do()
	if res.Error() != nil {
		return nil, res.Error()
	}

	snapshot := &portainer.KubernetesSnapshot{}

	err := snapshotVersion(snapshot, cli)
	if err != nil {
		log.Printf("[WARN] [kubernetes,snapshot] [message: unable to snapshot Kubelet version] [endpoint: %s] [err: %s]", endpoint.Name, err)
	}

	snapshot.Time = time.Now().Unix()
	return snapshot, nil
}

func snapshotVersion(snapshot *portainer.KubernetesSnapshot, cli *kubernetes.Clientset) error {
	nodeList, err := cli.CoreV1().Nodes().List(metav1.ListOptions{})
	if err != nil {
		return err
	}

	for _, node := range nodeList.Items {
		snapshot.KubeletVersion = node.Status.NodeInfo.KubeletVersion
		break
	}

	return nil
}
