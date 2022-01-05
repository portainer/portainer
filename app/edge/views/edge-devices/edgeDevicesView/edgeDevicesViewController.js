angular.module('portainer.edge').controller('EdgeDevicesViewController', EdgeDevicesViewController);

/* @ngInject */
export function EdgeDevicesViewController($scope, EndpointService, ModalService, Notifications) {
  $scope.getEnvironments = getEnvironments;

  console.log("EdgeDevicesViewController");
  console.log(EndpointService);

  function getEnvironments() {
    EndpointService.endpoints()
        .then(function success(data) {
          console.log("edgeDevices");
          console.log(data);
          $scope.edgeDevices = data.value;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve edge devices');
          $scope.edgeDevices = [];
        });
  }

  function initView() {
    getEnvironments();
  }

  initView();
}