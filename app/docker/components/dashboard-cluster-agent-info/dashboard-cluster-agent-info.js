angular.module('portainer.docker').component('dashboardClusterAgentInfo', {
  templateUrl: './dashboardClusterAgentInfo.html',
  controller: 'DashboardClusterAgentInfoController',
  bindings: {
    endpointId: '<',
  },
});
