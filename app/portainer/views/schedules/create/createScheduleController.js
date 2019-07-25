import {ScheduleDefaultModel} from '../../../models/schedule';

angular.module('portainer.app')
.controller('CreateScheduleController', ['$q', '$scope', '$state', 'Notifications', 'EndpointService', 'GroupService', 'ScheduleService',
function ($q, $scope, $state, Notifications, EndpointService, GroupService, ScheduleService) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.create = create;

  function create() {
    var model = $scope.model;

    $scope.state.actionInProgress = true;
    createSchedule(model)
    .then(function success() {
      Notifications.success('Schedule successfully created');
      $state.go('portainer.schedules', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create schedule');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  }

  function createSchedule(model) {
    if (model.Job.Method === 'editor') {
      return ScheduleService.createScheduleFromFileContent(model);
    }
    return ScheduleService.createScheduleFromFileUpload(model);
  }

  function initView() {
    $scope.model = new ScheduleDefaultModel();

    $q.all({
      endpoints: EndpointService.endpoints(),
      groups: GroupService.groups()
    })
    .then(function success(data) {
      $scope.endpoints = data.endpoints.value;
      $scope.groups = data.groups;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint list');
    });
  }

  initView();
}]);
