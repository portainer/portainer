package cli

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"maps"
	"time"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	labelPortainerKubeConfigOwner   = "io.portainer.kubernetes.configuration.owner"
	labelPortainerKubeConfigOwnerId = "io.portainer.kubernetes.configuration.owner.id"
)

// GetSecrets gets all the Secrets for a given namespace in a k8s endpoint.
// if the user is an admin, all secrets in the current k8s environment(endpoint) are fetched using the getSecrets function.
// otherwise, namespaces the non-admin user has access to will be used to filter the secrets based on the allowed namespaces.
func (kcl *KubeClient) GetSecrets(namespace string) ([]models.K8sSecret, error) {
	if kcl.GetIsKubeAdmin() {
		return kcl.getSecrets(namespace)
	}

	return kcl.getSecretsForNonAdmin(namespace)
}

// getSecretsForNonAdmin fetches the secrets in the namespaces the user has access to.
// This function is called when the user is not an admin.
func (kcl *KubeClient) getSecretsForNonAdmin(namespace string) ([]models.K8sSecret, error) {
	nonAdminNamespaces := kcl.GetClientNonAdminNamespaces()

	log.Debug().
		Strs("non_admin_namespaces", nonAdminNamespaces).
		Msg("fetching secrets for non-admin user")

	if len(nonAdminNamespaces) == 0 {
		return nil, nil
	}

	secrets, err := kcl.getSecrets(namespace)
	if err != nil {
		return nil, err
	}

	nonAdminNamespaceSet := kcl.buildNonAdminNamespacesMap()
	results := make([]models.K8sSecret, 0)
	for _, secret := range secrets {
		if _, ok := nonAdminNamespaceSet[secret.Namespace]; ok {
			results = append(results, secret)
		}
	}

	return results, nil
}

// getSecrets gets all the Secrets for a given namespace in a k8s endpoint.
// the result is a list of secrets parsed into a K8sSecret struct.
func (kcl *KubeClient) getSecrets(namespace string) ([]models.K8sSecret, error) {
	secrets, err := kcl.cli.CoreV1().Secrets(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := []models.K8sSecret{}
	for _, secret := range secrets.Items {
		results = append(results, parseSecret(&secret, false))
	}

	return results, nil
}

// GetSecret gets a Secret by name for a given namespace.
// the result is a secret parsed into a K8sSecret struct.
func (kcl *KubeClient) GetSecret(namespace string, secretName string) (models.K8sSecret, error) {
	secret, err := kcl.cli.CoreV1().Secrets(namespace).Get(context.Background(), secretName, metav1.GetOptions{})
	if err != nil {
		return models.K8sSecret{}, err
	}

	return parseSecret(secret, true), nil
}

// CreateSecret creates a secret in the given namespace. The returned secret carries
// metadata only: the caller already holds the data it just wrote, so it is not echoed
// back.
func (kcl *KubeClient) CreateSecret(namespace string, request models.K8sSecretWriteRequest) (models.K8sSecret, error) {
	secretType := corev1.SecretType(request.SecretType)
	if secretType == "" {
		secretType = corev1.SecretTypeOpaque
	}

	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:        request.Name,
			Namespace:   namespace,
			Labels:      request.Labels,
			Annotations: request.Annotations,
		},
		Type: secretType,
		// StringData is encoded by the API server, so plain values can be passed through.
		StringData: request.Data,
	}

	created, err := kcl.cli.CoreV1().Secrets(namespace).Create(context.Background(), secret, metav1.CreateOptions{})
	if err != nil {
		return models.K8sSecret{}, err
	}

	return parseSecret(created, false), nil
}

// UpdateSecret updates an existing secret in the given namespace. The live secret is
// read first so that fields the payload does not model, such as the immutable secret
// type, survive the update.
func (kcl *KubeClient) UpdateSecret(namespace string, request models.K8sSecretWriteRequest) (models.K8sSecret, error) {
	secret, err := kcl.cli.CoreV1().Secrets(namespace).Get(context.Background(), request.Name, metav1.GetOptions{})
	if err != nil {
		return models.K8sSecret{}, err
	}

	if request.Data != nil {
		// StringData is merged into Data by the API server, so the existing data has to
		// be dropped for the payload to replace it rather than add to it.
		secret.Data = nil
		secret.StringData = request.Data
	}
	if request.Labels != nil {
		secret.Labels = request.Labels
	}
	if request.Annotations != nil {
		secret.Annotations = request.Annotations
	}

	updated, err := kcl.cli.CoreV1().Secrets(namespace).Update(context.Background(), secret, metav1.UpdateOptions{})
	if err != nil {
		return models.K8sSecret{}, err
	}

	return parseSecret(updated, false), nil
}

// DeleteSecret deletes the named secret in the given namespace.
func (kcl *KubeClient) DeleteSecret(namespace, name string) error {
	return kcl.cli.CoreV1().Secrets(namespace).Delete(context.Background(), name, metav1.DeleteOptions{})
}

// secretAnnotations returns the secret's annotations without the one kubectl writes on
// apply, whose value is the whole object including its data. Leaving it in would hand
// the data to every caller withData is meant to withhold it from.
func secretAnnotations(secret *corev1.Secret) map[string]string {
	if _, hasLastApplied := secret.Annotations[lastAppliedConfigAnnotation]; !hasLastApplied {
		return secret.Annotations
	}

	annotations := maps.Clone(secret.Annotations)
	delete(annotations, lastAppliedConfigAnnotation)

	return annotations
}

// parseSecret parses a k8s Secret object into a K8sSecret struct.
// for get operation, withData will be set to true.
// otherwise, only metadata will be parsed.
func parseSecret(secret *corev1.Secret, withData bool) models.K8sSecret {
	result := models.K8sSecret{
		K8sConfiguration: models.K8sConfiguration{
			UID:                  string(secret.UID),
			Name:                 secret.Name,
			Namespace:            secret.Namespace,
			CreationDate:         secret.CreationTimestamp.Time.UTC().Format(time.RFC3339),
			Annotations:          secretAnnotations(secret),
			Labels:               secret.Labels,
			ConfigurationOwner:   secret.Labels[labelPortainerKubeConfigOwner],
			ConfigurationOwnerId: secret.Labels[labelPortainerKubeConfigOwnerId],
		},
		SecretType: string(secret.Type),
	}

	if withData {
		secretDataMap := make(map[string]string, len(secret.Data))
		for key, value := range secret.Data {
			// a secret holds arbitrary bytes and a JSON string must be valid UTF-8, so
			// values go over the wire base64 encoded, as the Kubernetes API does
			secretDataMap[key] = base64.StdEncoding.EncodeToString(value)
		}

		result.Data = secretDataMap
	}

	return result
}

// SetSecretsIsUsed combines the secrets with the applications that use them.
// the function fetches all the pods and service accounts in the cluster and checks if the secret is used by any of them.
// if the secret is used by a pod or service account, the secret is marked as used.
// otherwise, the secret is returned as is.
func (kcl *KubeClient) SetSecretsIsUsed(secrets *[]models.K8sSecret) error {
	portainerApplicationResources, err := kcl.fetchAllApplicationsListResources("", metav1.ListOptions{})
	if err != nil {
		return fmt.Errorf("an error occurred during the SetSecretsIsUsed operation, unable to fetch Portainer application resources. Error: %w", err)
	}

	serviceAccounts, err := kcl.GetServiceAccounts("")
	if err != nil {
		return fmt.Errorf("an error occurred during the SetSecretsIsUsed operation, unable to fetch service accounts. Error: %w", err)
	}

	for i := range *secrets {
		secret := &(*secrets)[i]

		if isSecretUsedByServiceAccount(*secret, serviceAccounts) {
			secret.IsUsed = true
			continue
		}

		for _, pod := range portainerApplicationResources.Pods {
			if isPodUsingSecret(&pod, *secret) {
				secret.IsUsed = true
				break
			}
		}
	}

	return nil
}

func isSecretUsedByServiceAccount(secret models.K8sSecret, serviceAccounts []models.K8sServiceAccount) bool {
	for _, serviceAccount := range serviceAccounts {
		if serviceAccount.Namespace != secret.Namespace {
			continue
		}

		for _, imagePullSecret := range serviceAccount.ImagePullSecrets {
			if imagePullSecret.Name == secret.Name {
				return true
			}
		}
	}

	return false
}

// CombineSecretWithApplications combines the secret with the applications that use it.
// the function fetches all the pods in the cluster and checks if the secret is used by any of the pods.
// it needs to check if the pods are owned by a replica set to determine if the pod is part of a deployment.
func (kcl *KubeClient) CombineSecretWithApplications(secret models.K8sSecret) (models.K8sSecret, error) {
	pods, err := kcl.cli.CoreV1().Pods(secret.Namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return models.K8sSecret{}, fmt.Errorf("an error occurred during the CombineSecretWithApplications operation, unable to get pods. Error: %w", err)
	}

	replicaSetsItems := []appsv1.ReplicaSet{}
	if containsReplicaSetOwnerReference(pods) {
		replicaSets, err := kcl.cli.AppsV1().ReplicaSets(secret.Namespace).List(context.Background(), metav1.ListOptions{})
		if err != nil {
			return models.K8sSecret{}, fmt.Errorf("an error occurred during the CombineSecretWithApplications operation, unable to get replica sets. Error: %w", err)
		}
		replicaSetsItems = replicaSets.Items
	}

	applicationConfigurationOwners, err := kcl.GetApplicationConfigurationOwnersFromSecret(secret, pods.Items, replicaSetsItems)
	if err != nil {
		return models.K8sSecret{}, fmt.Errorf("an error occurred during the CombineSecretWithApplications operation, unable to get applications from secret. Error: %w", err)
	}

	if len(applicationConfigurationOwners) > 0 {
		secret.ConfigurationOwnerResources = applicationConfigurationOwners
		secret.IsUsed = true
	}

	return secret, nil
}

func (kcl *KubeClient) createServiceAccountToken(serviceAccountName string) error {
	serviceAccountSecretName := userServiceAccountTokenSecretName(serviceAccountName, kcl.instanceID)

	serviceAccountSecret := &corev1.Secret{
		TypeMeta: metav1.TypeMeta{},
		ObjectMeta: metav1.ObjectMeta{
			Name: serviceAccountSecretName,
			Annotations: map[string]string{
				"kubernetes.io/service-account.name": serviceAccountName,
			},
		},
		Type: "kubernetes.io/service-account-token",
	}

	_, err := kcl.cli.CoreV1().Secrets(portainerNamespace).Create(context.TODO(), serviceAccountSecret, metav1.CreateOptions{})
	if err != nil && !k8serrors.IsAlreadyExists(err) {
		return err
	}

	return nil
}

func (kcl *KubeClient) getServiceAccountToken(serviceAccountName string) (string, error) {
	serviceAccountSecretName := userServiceAccountTokenSecretName(serviceAccountName, kcl.instanceID)

	secret, err := kcl.cli.CoreV1().Secrets(portainerNamespace).Get(context.TODO(), serviceAccountSecretName, metav1.GetOptions{})
	if err != nil {
		return "", err
	}

	// API token secret is populated asynchronously.
	// Is it created by the controller and will depend on the environment(endpoint)/secret-store:
	// https://github.com/kubernetes/kubernetes/issues/67882#issuecomment-422026204
	// as a work-around, we wait for up to 5 seconds for the secret to be populated.
	timeout := time.After(5 * time.Second)
	searchingForSecret := true
	for searchingForSecret {
		select {
		case <-timeout:
			return "", errors.New("unable to find secret token associated to user service account (timeout)")
		default:
			secret, err = kcl.cli.CoreV1().Secrets(portainerNamespace).Get(context.TODO(), serviceAccountSecretName, metav1.GetOptions{})
			if err != nil {
				return "", err
			}

			if len(secret.Data) > 0 {
				searchingForSecret = false
				break
			}

			time.Sleep(1 * time.Second)
		}
	}

	secretTokenData, ok := secret.Data["token"]
	if ok {
		return string(secretTokenData), nil
	}

	return "", errors.New("unable to find secret token associated to user service account")
}
