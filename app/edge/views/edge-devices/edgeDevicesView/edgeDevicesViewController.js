import { getEndpoints } from 'Portainer/environments/environment.service';

angular.module('portainer.edge').controller('EdgeDevicesViewController', EdgeDevicesViewController);
/* @ngInject */
export function EdgeDevicesViewController($q, $async, EndpointService, EdgeGroupService, GroupService, SettingsService, ModalService, Notifications) {
  var ctrl = this;

  ctrl.edgeDevices = [];

  this.getEnvironments = function () {
    return $async(async () => {
      try {
        const [endpointsResponse, groups, edgeGroups] = await Promise.all([
          getEndpoints(0, 100, { edgeDeviceFilter: 'trusted' }),
          GroupService.groups(),
          EdgeGroupService.groups(),
        ]);
        // Update GroupName and EdgeGroupName for each endpoint
        let groupNameMap = new Map();
        groups.forEach(function (group) {
          groupNameMap[group.Id] = group.Name;
        });
        let endpointEdgeGroupMap = new Map();
        endpointsResponse.value.forEach(function (endpoint) {
          endpoint.GroupName = groupNameMap[endpoint.GroupId] ? groupNameMap[endpoint.GroupId] : groupNameMap[1];
          endpoint.EdgeGroupName = 'Unassigned';
          endpointEdgeGroupMap[endpoint.Id] = [];
        });
        edgeGroups.forEach(function (edgeGroup) {
          edgeGroup.Endpoints.forEach(function (endpointId) {
            if (endpointEdgeGroupMap[Number(endpointId)]) {
              endpointEdgeGroupMap[Number(endpointId)].push(edgeGroup.Name);
            }
          });
        });
        endpointsResponse.value.forEach(function (endpoint) {
          if (endpointEdgeGroupMap[endpoint.Id].length > 0) {
            endpoint.EdgeGroupName = endpointEdgeGroupMap[endpoint.Id].join(', ');
          }
        });
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
