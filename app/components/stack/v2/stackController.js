angular.module('stackv2', [])
.controller('StackV2Controller', ['$scope', '$stateParams', '$state', 'ContainerService', 'Notifications',
function ($scope, $stateParams, $state, ContainerService, Notifications) {

  function initView() {
    $('#loadingViewSpinner').show();
    var stackName = $stateParams.name;
    var filters = {
      label: ['com.docker.compose.project=' + stackName]
    };

    ContainerService.containers(1, filters)
    .then(function success(data) {
      $scope.containers = data;
      $scope.stack = {
        Name: stackName
      };
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve tasks details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
