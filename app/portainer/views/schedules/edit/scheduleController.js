angular.module('portainer.app')
.controller('ScheduleController', ['$q', '$scope', '$transition$', '$state', 'Notifications', 'EndpointService', 'GroupService', 'ScheduleService',
function ($q, $scope, $transition$, $state, Notifications, EndpointService, GroupService, ScheduleService) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.update = update;

  function update() {
    var model = $scope.schedule;

    $scope.state.actionInProgress = true;
    ScheduleService.updateSchedule(model)
    .then(function success() {
      Notifications.success('Schedule successfully updated');
      $state.go('portainer.schedules', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update schedule');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  }

  function initView() {
    var id = $transition$.params().id;
    var schedule = null;

    $q.all({
      schedule: ScheduleService.schedule(id),
      endpoints: EndpointService.endpoints(),
      groups: GroupService.groups()
    })
    .then(function success(data) {
      schedule = data.schedule;
      $scope.endpoints = data.endpoints;
      $scope.groups = data.groups;

      return ScheduleService.getScriptFile(schedule.Id);
    })
    .then(function success(data) {
      schedule.Job.FileContent = data.ScheduleFileContent;
      $scope.schedule = schedule;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint list');
    });
  }

  initView();
}]);
