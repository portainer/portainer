import { ScheduleDefaultModel } from 'Portainer/models/schedule';

angular
  .module('portainer.edge')
  .controller('CreateEdgeJobController', function CreateEdgeJobController($q, $scope, $state, Notifications, EndpointService, GroupService, ScheduleService, TagService) {
    $scope.state = {
      actionInProgress: false,
    };

    $scope.create = create;

    function create() {
      var model = $scope.model;

      $scope.state.actionInProgress = true;
      createSchedule(model)
        .then(function success() {
          Notifications.success('Schedule successfully created');
          $state.go('portainer.schedules', {}, { reload: true });
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
        endpoints: EndpointService.endpoints(undefined, undefined, { type: 4 }),
        groups: GroupService.groups(),
        tags: TagService.tags(),
      })
        .then(function success(data) {
          $scope.endpoints = data.endpoints.value;
          $scope.groups = data.groups;
          $scope.tags = data.tags;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve endpoint list');
        });
    }

    initView();
  });
