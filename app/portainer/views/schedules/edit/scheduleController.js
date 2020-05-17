angular
  .module('portainer.app')
  .controller('ScheduleController', function ScheduleController(
    $q,
    $scope,
    $transition$,
    $state,
    Notifications,
    EndpointService,
    GroupService,
    ScheduleService,
    EndpointProvider,
    HostBrowserService,
    FileSaver,
    TagService
  ) {
    $scope.state = {
      actionInProgress: false,
    };

    $scope.update = update;
    $scope.goToContainerLogs = goToContainerLogs;
    $scope.getEdgeTaskLogs = getEdgeTaskLogs;

    function update() {
      var model = $scope.schedule;

      $scope.state.actionInProgress = true;
      ScheduleService.updateSchedule(model)
        .then(function success() {
          Notifications.success('Schedule successfully updated');
          $state.go('portainer.schedules', {}, { reload: true });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to update schedule');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    }

    function goToContainerLogs(endpointId, containerId) {
      EndpointProvider.setEndpointID(endpointId);
      $state.go('docker.containers.container.logs', { id: containerId });
    }

    function getEdgeTaskLogs(endpointId, scheduleId) {
      var currentId = EndpointProvider.endpointID();
      EndpointProvider.setEndpointID(endpointId);

      var filePath = '/host/opt/portainer/scripts/' + scheduleId + '.log';
      HostBrowserService.get(filePath)
        .then(function onFileReceived(data) {
          var downloadData = new Blob([data.file], {
            type: 'text/plain;charset=utf-8',
          });
          FileSaver.saveAs(downloadData, scheduleId + '.log');
        })
        .catch(function notifyOnError(err) {
          Notifications.error('Failure', err, 'Unable to download file');
        })
        .finally(function final() {
          EndpointProvider.setEndpointID(currentId);
        });
    }

    function associateEndpointsToTasks(tasks, endpoints) {
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];

        for (var j = 0; j < endpoints.length; j++) {
          var endpoint = endpoints[j];

          if (task.EndpointId === endpoint.Id) {
            task.Endpoint = endpoint;
            break;
          }
        }
      }
    }

    function initView() {
      var id = $transition$.params().id;

      $q.all({
        schedule: ScheduleService.schedule(id),
        file: ScheduleService.getScriptFile(id),
        tasks: ScheduleService.scriptExecutionTasks(id),
        endpoints: EndpointService.endpoints(undefined, undefined, { type: 4 }),
        groups: GroupService.groups(),
        tags: TagService.tags(),
      })
        .then(function success(data) {
          var schedule = data.schedule;
          schedule.Job.FileContent = data.file.ScheduleFileContent;

          var endpoints = data.endpoints.value;
          var tasks = data.tasks;
          associateEndpointsToTasks(tasks, endpoints);

          $scope.schedule = schedule;
          $scope.tasks = data.tasks;
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
