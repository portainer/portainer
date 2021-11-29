import angular from 'angular';

class EndpointKVMController {
  /* @ngInject */
  constructor($state, OpenAMTService, $async) {
    this.$state = $state;
    this.$async = $async;
    this.OpenAMTService = OpenAMTService;

    // this.updateAccess = this.updateAccess.bind(this);
  }

  async $onInit() {
    try {
      // TODO fetch mps server && token
      // this.state.loaded = true;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to connect to device');
    }
  }

  updateAccess() {
    return this.$async(this.updateAccessAsync);
  }

}

export default EndpointKVMController;
angular.module('portainer.app').controller('EndpointKVMController', EndpointKVMController);
