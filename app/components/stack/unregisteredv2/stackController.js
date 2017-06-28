angular.module('unregisteredstackv2', [])
.controller('UnregisteredStackV2Controller', ['$q', '$scope', '$state', '$stateParams', 'StackService', 'Notifications',
function ($q, $scope, $state, $stateParams, StackService, Notifications) {

  function initView() {
    $('#loadingViewSpinner').show();
    var stackName = $stateParams.name;
    $scope.Name = stackName;

    StackService.getStackV2ServicesAndContainers(stackName)
    .then(function success(data) {
      $scope.services = data.services;
      $scope.containers = data.containers;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve stack details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
