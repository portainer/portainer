class DockerRegistryAccessController {
  /* @ngInject */
  constructor($async, $transition$, Notifications, RegistryService) {
    this.$async = $async;
    this.$transition$ = $transition$;
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
      this.state = { actionInProgress: false };
      this.RegistryService.registry(this.$transition$.params().id)
        .then(function success(data) {
          this.registry = data;
        })
        .catch(function error(err) {
          this.Notifications.error('Failure', err, 'Unable to retrieve registry details');
        });
    });
  }
}

export default DockerRegistryAccessController;
angular.module('portainer.docker').controller('DockerRegistryAccessController', DockerRegistryAccessController);
