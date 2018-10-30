angular.module('portainer.app')
.controller('ScheduleController', ['$q', '$scope', '$transition$', 'Notifications', 'EndpointService', 'GroupService', 'ScheduleService',
function ($q, $scope, $transition$, Notifications, EndpointService, GroupService, ScheduleService) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.update = function() {
    // var model = $scope.schedule;
  };

  function initView() {
    var id = $transition$.params().id;

    $q.all({
      schedule: ScheduleService.schedule(id),
      endpoints: EndpointService.endpoints(),
      groups: GroupService.groups()
    })
    .then(function success(data) {
      $scope.schedule = data.schedule;
      $scope.endpoints = data.endpoints;
      $scope.groups = data.groups;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint list');
    });
  }

  initView();
}]);
