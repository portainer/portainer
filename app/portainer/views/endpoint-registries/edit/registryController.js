class EndpointRegistryController {
  /* @ngInject */
  constructor($async, $state, $transition$, Notifications, RegistryService) {
    this.$async = $async;
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.RegistryService = RegistryService;
  }

  $updateRegistry() {
    var registry = this.registry;
    registry.Password = this.formValues.Password;
    this.state.actionInProgress = true;
    this.RegistryService.updateRegistry(registry)
      .then(function success() {
        this.Notifications.success('Registry successfully updated');
        this.$state.go('portainer.registries');
      })
      .catch(function error(err) {
        this.Notifications.error('Failure', err, 'Unable to update registry');
      })
      .finally(function final() {
        this.state.actionInProgress = false;
      });
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        actionInProgress: false,
      };

      this.formValues = {
        Password: '',
      };

      const registryID = this.$transition$.params().id;
      this.RegistryService.registry(registryID)
        .then(function success(data) {
          this.registry = data;
        })
        .catch(function error(err) {
          this.Notifications.error('Failure', err, 'Unable to retrieve registry details');
        });
    });
  }
}

export default EndpointRegistryController;
angular.module('portainer.app').controller('EndpointRegistryController', EndpointRegistryController);
