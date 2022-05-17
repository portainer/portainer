import { getEndpoints } from 'Portainer/environments/environment.service';

angular.module('portainer.edge').controller('EdgeDevicesViewController', EdgeDevicesViewController);
/* @ngInject */
export function EdgeDevicesViewController($q, $async, EndpointService, GroupService, SettingsService, ModalService, Notifications) {
  var ctrl = this;

  ctrl.edgeDevices = [];

  this.getEnvironments = function () {
    return $async(async () => {
      try {
        const [endpointsResponse, groups] = await Promise.all([
          getEndpoints(0, 100, {
            edgeDeviceFilter: 'trusted',
          }),
          GroupService.groups(),
        ]);
        ctrl.groups = groups;
        ctrl.edgeDevices = endpointsResponse.value;
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to retrieve edge devices');
        ctrl.edgeDevices = [];
      }
    });
  };

  this.getSettings = function () {
    return $async(async () => {
      try {
        const settings = await SettingsService.settings();

        ctrl.isFDOEnabled = settings && settings.EnableEdgeComputeFeatures && settings.fdoConfiguration && settings.fdoConfiguration.enabled;
        ctrl.showWaitingRoomLink = process.env.PORTAINER_EDITION === 'BE' && settings && settings.EnableEdgeComputeFeatures && !settings.TrustOnFirstConnect;
        ctrl.isOpenAMTEnabled = settings && settings.EnableEdgeComputeFeatures && settings.openAMTConfiguration && settings.openAMTConfiguration.enabled;
        ctrl.mpsServer = ctrl.isOpenAMTEnabled ? settings.openAMTConfiguration.mpsServer : '';
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to retrieve settings');
      }
    });
  };

  this.setLoadingMessage = function (message) {
    return $async(async () => {
      ctrl.loadingMessage = message;
    });
  };

  function initView() {
    ctrl.getEnvironments();
    ctrl.getSettings();
  }

  initView();
}
