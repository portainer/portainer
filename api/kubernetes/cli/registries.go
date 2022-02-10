package cli

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/pkg/errors"
	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/internal/registryutils"
	v1 "k8s.io/api/core/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	secretDockerConfigKey = ".dockerconfigjson"
	labelRegistryType     = "io.portainer.kubernetes.registry.type"
	annotationRegistryID  = "portainer.io/registry.id"
)

type (
	dockerConfig struct {
		Auths map[string]registryDockerConfig `json:"auths"`
	}

	registryDockerConfig struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
	}
)

func (kcl *KubeClient) DeleteRegistrySecret(registry *portainer.Registry, namespace string) error {
	err := kcl.cli.CoreV1().Secrets(namespace).Delete(context.TODO(), registrySecretName(registry), metav1.DeleteOptions{})
	if err != nil && !k8serrors.IsNotFound(err) {
		return errors.Wrap(err, "failed removing secret")
	}

	return nil
}

func (kcl *KubeClient) CreateRegistrySecret(registry *portainer.Registry, namespace string) (err error) {
	username, password, err := registryutils.GetRegEffectiveCredential(registry)
	if err != nil {
		return
	}

	config := dockerConfig{
		Auths: map[string]registryDockerConfig{
			registry.URL: {
				Username: username,
				Password: password,
			},
		},
	}

	configByte, err := json.Marshal(config)
	if err != nil {
		return errors.Wrap(err, "failed marshal config")
	}

	secret := &v1.Secret{
		TypeMeta: metav1.TypeMeta{},
		ObjectMeta: metav1.ObjectMeta{
			Name: registrySecretName(registry),
			Labels: map[string]string{
				labelRegistryType: strconv.Itoa(int(registry.Type)),
			},
			Annotations: map[string]string{
				annotationRegistryID: strconv.Itoa(int(registry.ID)),
			},
		},
		Data: map[string][]byte{
			secretDockerConfigKey: configByte,
		},
		Type: v1.SecretTypeDockerConfigJson,
	}

	_, err = kcl.cli.CoreV1().Secrets(namespace).Create(context.TODO(), secret, metav1.CreateOptions{})
	if err != nil && !k8serrors.IsAlreadyExists(err) {
		return errors.Wrap(err, "failed saving secret")
	}

	return nil

}

func (cli *KubeClient) IsRegistrySecret(namespace, secretName string) (bool, error) {
	secret, err := cli.cli.CoreV1().Secrets(namespace).Get(context.TODO(), secretName, metav1.GetOptions{})
	if err != nil {
		if k8serrors.IsNotFound(err) {
			return false, nil
		}

		return false, err
	}

	isSecret := secret.Type == v1.SecretTypeDockerConfigJson

	return isSecret, nil

}

func registrySecretName(registry *portainer.Registry) string {
	return fmt.Sprintf("registry-%d", registry.ID)
}
