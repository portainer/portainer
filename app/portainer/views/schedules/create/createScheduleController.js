angular.module('portainer.app')
.controller('CreateScheduleController', ['$q', '$scope', 'Notifications', 'EndpointService', 'GroupService',
function ($q, $scope, Notifications, EndpointService, GroupService) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.create = create;

  function create() {
    // var model = $scope.model;
  }

  function initView() {
    $scope.model = new ScheduleDefaultModel();

    $q.all({
      endpoints: EndpointService.endpoints(),
      groups: GroupService.groups()
    })
    .then(function success(data) {
      $scope.endpoints = data.endpoints;
      $scope.groups = data.groups;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint list');
    });
  }

  initView();
}]);
