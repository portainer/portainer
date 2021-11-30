import angular from 'angular';

class EndpointKVMController {
  /* @ngInject */
  constructor($state, $transition$, EndpointService, OpenAMTService, Notifications, $async) {
    this.$state = $state;
    this.$async = $async;
    this.$transition$ = $transition$;
    this.OpenAMTService = OpenAMTService;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;

    this.$state.endpointId = $transition$.params().id;
    this.$state.deviceId = $transition$.params().deviceId;
    this.$state.deviceName = $transition$.params().deviceName;
  }

  async $onInit() {
    try {
      this.$state.endpoint = await this.EndpointService.endpoint(this.$state.endpointId);

      const mpsAuthorization = await this.OpenAMTService.authorization(this.$state.endpointId);
      this.$state.mpsServer = mpsAuthorization.Server;
      this.$state.mpsToken = mpsAuthorization.Token;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve environment information');
    }
  }
}

export default EndpointKVMController;
angular.module('portainer.app').controller('EndpointKVMController', EndpointKVMController);
