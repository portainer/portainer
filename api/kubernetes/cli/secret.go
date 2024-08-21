package cli

import (
	"context"
	"errors"
	"time"

	models "github.com/portainer/portainer/api/http/models/kubernetes"
	"github.com/rs/zerolog/log"
	corev1 "k8s.io/api/core/v1"
	v1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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
	log.Debug().Msgf("Fetching volumes for non-admin user: %v", kcl.NonAdminNamespaces)

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
// the result is a list of config maps parsed into a K8sSecret struct.
func (kcl *KubeClient) getSecrets(namespace string) ([]models.K8sSecret, error) {
	secrets, err := kcl.cli.CoreV1().Secrets(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return nil, err
	}

	results := []models.K8sSecret{}
	for _, secret := range secrets.Items {
		results = append(results, parseSecret(&secret))
	}

	return results, nil
}

// parseSecret parses a k8s Secret object into a K8sSecret struct.
func parseSecret(secret *corev1.Secret) models.K8sSecret {
	secretData := secret.Data
	secretDataMap := make(map[string]string, len(secretData))
	for k, v := range secretData {
		secretDataMap[k] = string(v)
	}

	return models.K8sSecret{
		K8sConfiguration: models.K8sConfiguration{
			UID:          string(secret.UID),
			Name:         secret.Name,
			Namespace:    secret.Namespace,
			CreationDate: secret.CreationTimestamp.Time.UTC().Format(time.RFC3339),
			Annotations:  secret.Annotations,
			Data:         secretDataMap,
		},
		SecretType: string(secret.Type),
	}
}

func (kcl *KubeClient) createServiceAccountToken(serviceAccountName string) error {
	serviceAccountSecretName := userServiceAccountTokenSecretName(serviceAccountName, kcl.instanceID)

	serviceAccountSecret := &v1.Secret{
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
