import angular from 'angular';

import { enableDeviceFeatures } from 'Portainer/hostmanagement/open-amt/open-amt.service';

class EndpointKVMController {
  /* @ngInject */
  constructor($state, $scope, $async, $transition$, EndpointService, Notifications) {
    this.$state = $state;
    this.$scope = $scope;
    this.$async = $async;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.EndpointService = EndpointService;

    this.$state.maximized = false;
    this.$state.endpointId = $transition$.params().id;
    this.$state.deviceId = $transition$.params().deviceId;
    this.$state.deviceName = $transition$.params().deviceName;

    $scope.maximize = function () {
      this.$state.maximized = true;
    };

    $scope.minimize = function () {
      this.$state.maximized = false;
    };
  }

  async $onInit() {
    this.$async(async () => {
      try {
        this.$state.endpoint = await this.EndpointService.endpoint(this.$state.endpointId);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve environment information');
      }

      try {
        const features = {
          ider: true,
          kvm: true,
          sol: true,
          redirection: true,
          userConsent: 'none',
        };
        const mpsAuthorization = await enableDeviceFeatures(this.$state.endpointId, this.$state.deviceId, features);

        this.$state.mpsServer = mpsAuthorization.Server;
        this.$state.mpsToken = mpsAuthorization.Token;
      } catch (e) {
        this.Notifications.error('Failure', e, `Failed to load kvm for device`);
      }
    });
  }
}

export default EndpointKVMController;
angular.module('portainer.app').controller('EndpointKVMController', EndpointKVMController);
