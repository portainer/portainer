angular.module('portainer.edge').controller('EdgeDevicesViewController', EdgeDevicesViewController);

/* @ngInject */
export function EdgeDevicesViewController($scope, EndpointService, ModalService, Notifications) {
  console.log("EdgeDevicesViewController");

  $scope.getEnvironments = getEnvironments;
  function getEnvironments() {
    EndpointService.endpoints()
        .then(function success(data) {
          $scope.edgeDevices = data.value;
          console.log($scope.edgeDevices);
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