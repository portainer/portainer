package cli

import (
	"context"
	"errors"
	"fmt"
	"time"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
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
	if kcl.IsKubeAdmin {
		return kcl.getSecrets(namespace)
	}
	return kcl.getSecretsForNonAdmin(namespace)
}

// getSecretsForNonAdmin fetches the secrets in the namespaces the user has access to.
// This function is called when the user is not an admin.
func (kcl *KubeClient) getSecretsForNonAdmin(namespace string) ([]models.K8sSecret, error) {
	log.Debug().Msgf("Fetching secrets for non-admin user: %v", kcl.NonAdminNamespaces)

	if len(kcl.NonAdminNamespaces) == 0 {
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
			Annotations:          secret.Annotations,
			Labels:               secret.Labels,
			ConfigurationOwner:   secret.Labels[labelPortainerKubeConfigOwner],
			ConfigurationOwnerId: secret.Labels[labelPortainerKubeConfigOwnerId],
		},
		SecretType: string(secret.Type),
	}

	if withData {
		secretData := secret.Data
		secretDataMap := make(map[string]string, len(secretData))
		for key, value := range secretData {
			secretDataMap[key] = string(value)
		}

		result.Data = secretDataMap
	}

	return result
}

// CombineSecretsWithApplications combines the secrets with the applications that use them.
// the function fetches all the pods and replica sets in the cluster and checks if the secret is used by any of the pods.
// if the secret is used by a pod, the application that uses the pod is added to the secret.
// otherwise, the secret is returned as is.
func (kcl *KubeClient) CombineSecretsWithApplications(secrets []models.K8sSecret) ([]models.K8sSecret, error) {
	updatedSecrets := make([]models.K8sSecret, len(secrets))

	portainerApplicationResources, err := kcl.fetchAllApplicationsListResources("", metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("an error occurred during the CombineSecretsWithApplications operation, unable to fetch pods and replica sets. Error: %w", err)
	}

	for index, secret := range secrets {
		updatedSecret := secret

		applicationConfigurationOwners, err := kcl.GetApplicationConfigurationOwnersFromSecret(secret, portainerApplicationResources.Pods, portainerApplicationResources.ReplicaSets)
		if err != nil {
			return nil, fmt.Errorf("an error occurred during the CombineSecretsWithApplications operation, unable to get applications from secret. Error: %w", err)
		}

		if len(applicationConfigurationOwners) > 0 {
			updatedSecret.ConfigurationOwnerResources = applicationConfigurationOwners
		}

		updatedSecrets[index] = updatedSecret
	}

	return updatedSecrets, nil
}

// CombineSecretWithApplications combines the secret with the applications that use it.
// the function fetches all the pods in the cluster and checks if the secret is used by any of the pods.
// it needs to check if the pods are owned by a replica set to determine if the pod is part of a deployment.
func (kcl *KubeClient) CombineSecretWithApplications(secret models.K8sSecret) (models.K8sSecret, error) {
	pods, err := kcl.cli.CoreV1().Pods(secret.Namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return models.K8sSecret{}, fmt.Errorf("an error occurred during the CombineSecretWithApplications operation, unable to get pods. Error: %w", err)
	}

	containsReplicaSetOwner := false
	for _, pod := range pods.Items {
		containsReplicaSetOwner = isReplicaSetOwner(pod)
		break
	}

	if containsReplicaSetOwner {
		replicaSets, err := kcl.cli.AppsV1().ReplicaSets(secret.Namespace).List(context.Background(), metav1.ListOptions{})
		if err != nil {
			return models.K8sSecret{}, fmt.Errorf("an error occurred during the CombineSecretWithApplications operation, unable to get replica sets. Error: %w", err)
		}

		applicationConfigurationOwners, err := kcl.GetApplicationConfigurationOwnersFromSecret(secret, pods.Items, replicaSets.Items)
		if err != nil {
			return models.K8sSecret{}, fmt.Errorf("an error occurred during the CombineSecretWithApplications operation, unable to get applications from secret. Error: %w", err)
		}

		if len(applicationConfigurationOwners) > 0 {
			secret.ConfigurationOwnerResources = applicationConfigurationOwners
		}
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
