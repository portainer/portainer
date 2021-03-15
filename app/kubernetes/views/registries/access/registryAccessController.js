import { RegistryViewModel } from '../../../../portainer/models/registry';

class KubernetesRegistryAccessController {
  /* @ngInject */
  constructor($async, Notifications, RegistryService) {
    this.$async = $async;
    this.Notifications = Notifications;
    this.RegistryService = RegistryService;
  }

  updateAccess() {
    this.state.actionInProgress = true;
    this.RegistryService.updateRegistry(this.registry)
      .then(() => {
        this.Notifications.success('Access successfully updated');
        this.reload();
      })
      .catch((err) => {
        this.state.actionInProgress = false;
        this.Notifications.error('Failure', err, 'Unable to update accesses');
      });
  }

  $onInit() {
    return this.$async(async () => {
      try {
        this.state = {
          actionInProgress: false,
        };
        const registry = await this.RegistryService.registry(this.$transition$.params().id);
        this.registry = new RegistryViewModel(registry);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve registry details');
      } finally {
        this.state.viewReady = true;
      }
    });
  }
}

export default KubernetesRegistryAccessController;
angular.module('portainer.kubernetes').controller('KubernetesRegistryAccessController', KubernetesRegistryAccessController);
