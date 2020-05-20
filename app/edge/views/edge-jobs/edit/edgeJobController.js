angular
  .module('portainer.edge')
  .controller('EdgeJobController', function EdgeJobController(
    $q,
    $scope,
    $transition$,
    $state,
    Notifications,
    EndpointService,
    GroupService,
    EdgeJobService,
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
      var model = $scope.edgeJob;

      $scope.state.actionInProgress = true;
      EdgeJobService.updateEdgeJob(model)
        .then(function success() {
          Notifications.success('Edge job successfully updated');
          $state.go('edge.jobs', {}, { reload: true });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to update Edge job');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    }

    function goToContainerLogs(endpointId, containerId) {
      EndpointProvider.setEndpointID(endpointId);
      $state.go('docker.containers.container.logs', { id: containerId });
    }

    function getEdgeTaskLogs(endpointId, edgeJob) {
      var currentId = EndpointProvider.endpointID();
      EndpointProvider.setEndpointID(endpointId);
      const logFileName = `${edgeJob}.log`;
      var filePath = `/host/opt/portainer/scripts/${logFileName}`;
      HostBrowserService.get(filePath)
        .then(function onFileReceived(data) {
          var downloadData = new Blob([data.file], {
            type: 'text/plain;charset=utf-8',
          });
          FileSaver.saveAs(downloadData, logFileName);
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
        edgeJob: EdgeJobService.edgeJob(id),
        file: EdgeJobService.getScriptFile(id),
        tasks: EdgeJobService.scriptExecutionTasks(id),
        endpoints: EndpointService.endpoints(undefined, undefined, { type: 4 }),
        groups: GroupService.groups(),
        tags: TagService.tags(),
      })
        .then(function success(data) {
          var edgeJob = data.edgeJob;
          edgeJob.FileContent = data.file.FileContent;

          var endpoints = data.endpoints.value;
          var tasks = data.tasks;
          associateEndpointsToTasks(tasks, endpoints);

          $scope.edgeJob = edgeJob;
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
