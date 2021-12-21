import angular from 'angular';

import { enableDeviceFeatures } from '@/portainer/services/api/hostmanagement/open-amt.service';

class EndpointKVMController {
  /* @ngInject */
  constructor($state, $scope, $transition$, EndpointService, Notifications) {
    this.$state = $state;
    this.$scope = $scope;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;

    this.$state.maximized = false;
    this.$state.endpointId = $transition$.params().id;
    this.$state.deviceId = $transition$.params().deviceId;
    this.$state.deviceName = $transition$.params().deviceName;

    $scope.maximize = function() {
      this.$state.maximized = true;
    }

    $scope.minimize = function() {
      this.$state.maximized = false;
    }
  }


  async $onInit() {
    try {
      this.$state.endpoint = await this.EndpointService.endpoint(this.$state.endpointId);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve environment information');
    }

    try {
      const features = {
        IDER: true,
        KVM: true,
        SOL: true,
        redirection: true,
        userConsent: 'none',
      };
      const mpsAuthorization = await enableDeviceFeatures(this.$state.endpointId, this.$state.deviceId, features);

      this.$scope.$evalAsync(() => {
        this.$state.mpsServer = mpsAuthorization.Server;
        this.$state.mpsToken = mpsAuthorization.Token;
      })
    } catch (e) {
      this.Notifications.error('Failure', e, `Failed to load kvm for device`);
    }
  }
}

export default EndpointKVMController;
angular.module('portainer.app').controller('EndpointKVMController', EndpointKVMController);
