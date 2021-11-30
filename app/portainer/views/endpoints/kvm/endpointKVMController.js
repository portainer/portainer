import angular from 'angular';

class EndpointKVMController {
  /* @ngInject */
  constructor($state, $transition$, EndpointService, OpenAMTService, Notifications, $async) {
    this.$state = $state;
    this.$async = $async;
    this.$transition$ = $transition$;
    this.OpenAMTService = OpenAMTService;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService

    this.endpointId = $transition$.params().id;
    this.deviceId = $transition$.params().deviceId;
    this.deviceName = $transition$.params().deviceName;
  }

  async $onInit() {
    try {
      this.endpoint = this.EndpointService.endpoint(this.endpointId);

      const mpsAuthorization = await this.OpenAMTService.authorization(this.endpoint);
      console.log(mpsAuthorization);
      this.server = mps
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve environment information');
    }
  }

}

export default EndpointKVMController;
angular.module('portainer.app').controller('EndpointKVMController', EndpointKVMController);
