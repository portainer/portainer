import angular from 'angular';
import _ from 'lodash-es';

function EdgeJobController($q, $state, Notifications, GroupService, EdgeJobService, EndpointService, EndpointProvider, HostBrowserService, FileSaver, TagService) {
  this.state = {
    actionInProgress: false,
  };

  this.update = update.bind(this);
  this.getEdgeTaskLogs = getEdgeTaskLogs.bind(this);

  function update() {
    var model = this.edgeJob;

    this.state.actionInProgress = true;
    EdgeJobService.updateEdgeJob(model)
      .then(() => {
        Notifications.success('Edge job successfully updated');
        $state.go('edge.jobs', {}, { reload: true });
      })
      .catch((err) => {
        Notifications.error('Failure', err, 'Unable to update Edge job');
      })
      .finally(() => {
        this.state.actionInProgress = false;
      });
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
    return _.map(tasks, (task) => {
      const endpoint = _.find(endpoints, (endpoint) => endpoint.Id === task.EndpointId);
      task.Endpoint = endpoint;
      return task;
    });
  }
  this.$onInit = $onInit;

  async function $onInit() {
    const { id } = $state.params;
    try {
      const data = await $q.all({
        edgeJob: EdgeJobService.edgeJob(id),
        file: EdgeJobService.getScriptFile(id),
        tasks: EdgeJobService.scriptExecutionTasks(id),
        groups: GroupService.groups(),
        tags: TagService.tags(),
      });
      var edgeJob = data.edgeJob;
      edgeJob.FileContent = data.file.FileContent;

      this.edgeJob = edgeJob;
      this.groups = data.groups;
      this.tags = data.tags;

      let tasks = data.tasks;
      if (tasks.length > 0) {
        const endpointIds = _.map(tasks, (task) => task.EndpointId);
        const endpoints = await EndpointService.endpoints(undefined, undefined, { endpointIds });
        tasks = associateEndpointsToTasks(tasks, endpoints.value);
      }
      this.tasks = tasks;
    } catch (err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint list');
    }
  }
}

angular.module('portainer.edge').controller('EdgeJobController', EdgeJobController);
export default EdgeJobController;
