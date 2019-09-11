import angular from 'angular';

class KubernetesSecretsController {
  /* @ngInject */
  constructor($async, Notifications, KubernetesSecretService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.KubernetesSecretService = KubernetesSecretService;

    this.getSecrets = this.getSecrets.bind(this);
    this.getSecretsAsync = this.getSecretsAsync.bind(this);
  }

  async getSecretsAsync() {
    try {
      this.secrets = await this.KubernetesSecretService.secrets();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve secrets');
    }
  }

  getSecrets() {
    return this.$async(this.getSecretsAsync);
  }

  async $onInit() {
    this.getSecrets();
  }
}

export default KubernetesSecretsController;
angular.module('portainer.kubernetes').controller('KubernetesSecretsController', KubernetesSecretsController);
