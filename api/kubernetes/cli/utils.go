package cli

import (
	"fmt"
	"net/http"

	portaineree "github.com/portainer/portainer/api"
	httperror "github.com/portainer/portainer/pkg/libhttp/error"
	"github.com/portainer/portainer/pkg/libhttp/response"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
)

// CombineNamespacesWithResourceQuotas combines namespaces with resource quotas where matching is based on "portainer-rq-"+namespace.Name
func (kcl *KubeClient) CombineNamespacesWithResourceQuotas(namespaces map[string]portaineree.K8sNamespaceInfo, w http.ResponseWriter) *httperror.HandlerError {
	resourceQuotas, err := kcl.GetResourceQuotas("")
	if err != nil {
		return httperror.InternalServerError("an error occurred during the CombineNamespacesWithResourceQuotas operation, unable to retrieve resource quotas from the Kubernetes for an admin user. Error: ", err)
	}

	if len(*resourceQuotas) > 0 {
		return response.JSON(w, kcl.UpdateNamespacesWithResourceQuotas(namespaces, *resourceQuotas))
	}

	return response.JSON(w, namespaces)
}

// CombineNamespaceWithResourceQuota combines a namespace with a resource quota prefixed with "portainer-rq-"+namespace.Name
func (kcl *KubeClient) CombineNamespaceWithResourceQuota(namespace portaineree.K8sNamespaceInfo, w http.ResponseWriter) *httperror.HandlerError {
	resourceQuota, err := kcl.GetPortainerResourceQuota(namespace.Name)
	if err != nil && !k8serrors.IsNotFound(err) {
		return httperror.InternalServerError(fmt.Sprintf("an error occurred during the CombineNamespaceWithResourceQuota operation, unable to retrieve the resource quota associated with the namespace: %s for a non-admin user. Error: ", namespace.Name), err)
	}
	namespace.ResourceQuota = resourceQuota

	return response.JSON(w, namespace)
}
