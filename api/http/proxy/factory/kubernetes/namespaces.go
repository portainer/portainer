package kubernetes

import (
	"bytes"
	"io"
	"net/http"

	"github.com/pkg/errors"
	"github.com/portainer/portainer/api/dataservices"
	"github.com/portainer/portainer/api/kubernetes/namespacecleanup"
	"github.com/portainer/portainer/api/logs"
	"github.com/portainer/portainer/api/pendingactions/handlers"
	"github.com/segmentio/encoding/json"

	"github.com/rs/zerolog/log"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const namespaceDeleteLogContext = "KubernetesNamespaceDelete"

// proxyNamespaceDeleteOperation forwards the namespace deletion to Kubernetes and only removes the
// namespace from Portainer's own records once Kubernetes has accepted it, so a denied or failed
// deletion leaves access policies, registry bindings and stacks untouched.
func (transport *baseTransport) proxyNamespaceDeleteOperation(request *http.Request, namespace string) (*http.Response, error) {
	// A dry run is accepted without deleting anything
	dryRun, err := isDryRun(request)
	if err != nil {
		return nil, err
	}

	if dryRun {
		return transport.executeKubernetesRequest(request)
	}

	// Read before the deletion, so a retried cleanup can tell this namespace apart from one recreated later
	namespaceUID := transport.namespaceUID(namespace)

	resp, err := transport.executeKubernetesRequest(request)
	if !isSuccessfulResponse(resp, err) {
		return resp, err
	}

	cleanupErr := namespacecleanup.RemovePortainerRecords(transport.dataStore, transport.tokenManager.kubecli, transport.endpoint.ID, namespace)
	if cleanupErr == nil {
		return resp, nil
	}

	// Deleting the namespace again only gets a 404 from Kubernetes, so the cleanup is queued to be retried
	if err := transport.queueNamespaceCleanup(namespace, namespaceUID); err != nil {
		logs.CloseAndLogErr(resp.Body)

		return nil, errors.WithMessagef(err, "namespace [%s] was deleted but its Portainer records could neither be cleaned up (%v) nor queued for cleanup", namespace, cleanupErr)
	}

	log.Warn().
		Err(cleanupErr).
		Str("context", namespaceDeleteLogContext).
		Str("namespace", namespace).
		Int("endpoint_id", int(transport.endpoint.ID)).
		Msg("Failed to clean up the Portainer records of a deleted namespace, retrying later")

	return resp, nil
}

// isDryRun reports whether Kubernetes will only simulate the deletion, which it accepts either as a
// query parameter or in the DeleteOptions body. Only a JSON body is inspected, as sent by kubectl and the UI.
func isDryRun(request *http.Request) (bool, error) {
	if request.URL.Query().Has("dryRun") {
		return true, nil
	}

	if request.Body == nil || request.Body == http.NoBody {
		return false, nil
	}

	body, err := io.ReadAll(request.Body)
	if err != nil {
		return false, errors.Wrap(err, "failed to read the namespace delete request body")
	}
	logs.CloseAndLogErr(request.Body)
	request.Body = io.NopCloser(bytes.NewReader(body))

	var options metav1.DeleteOptions
	if err := json.Unmarshal(body, &options); err != nil {
		return false, nil
	}

	return len(options.DryRun) > 0, nil
}

func (transport *baseTransport) queueNamespaceCleanup(namespace, namespaceUID string) error {
	action := handlers.NewCleanupNamespaceRecords(transport.endpoint.ID, namespace, namespaceUID)

	return transport.dataStore.UpdateTx(func(tx dataservices.DataStoreTx) error {
		return tx.PendingActions().Create(&action)
	})
}

// namespaceUID returns the UID of the namespace about to be deleted, or an empty string when it cannot be read
func (transport *baseTransport) namespaceUID(namespace string) string {
	info, err := transport.tokenManager.kubecli.GetNamespace(namespace)
	if err == nil {
		return info.Id
	}

	if !k8serrors.IsNotFound(err) {
		log.Warn().
			Err(err).
			Str("context", namespaceDeleteLogContext).
			Str("namespace", namespace).
			Int("endpoint_id", int(transport.endpoint.ID)).
			Msg("Failed to read the namespace before deleting it, a failed cleanup will wait until the namespace is gone")
	}

	return ""
}
