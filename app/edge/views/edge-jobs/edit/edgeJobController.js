import angular from 'angular';
import _ from 'lodash-es';

class EdgeJobController {
  constructor($q, $state, EdgeJobService, EndpointProvider, EndpointService, FileSaver, GroupService, HostBrowserService, Notifications, TagService) {
    this.state = {
      actionInProgress: false,
    };

    this.$q = $q;
    this.$state = $state;
    this.EdgeJobService = EdgeJobService;
    this.EndpointProvider = EndpointProvider;
    this.EndpointService = EndpointService;
    this.FileSaver = FileSaver;
    this.GroupService = GroupService;
    this.HostBrowserService = HostBrowserService;
    this.Notifications = Notifications;
    this.TagService = TagService;

    this.update = this.update.bind(this);
    this.getEdgeTaskLogs = this.getEdgeTaskLogs.bind(this);
  }

  update() {
    var model = this.edgeJob;
    this.state.actionInProgress = true;
    this.EdgeJobService.updateEdgeJob(model)
      .then(() => {
        this.Notifications.success('Edge job successfully updated');
        this.$state.go('edge.jobs', {}, { reload: true });
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to update Edge job');
      })
      .finally(() => {
        this.state.actionInProgress = false;
      });
  }
  getEdgeTaskLogs(endpointId, edgeJob) {
    var currentId = this.EndpointProvider.endpointID();
    this.EndpointProvider.setEndpointID(endpointId);
    const logFileName = `${edgeJob}.log`;
    var filePath = `/host/opt/portainer/scripts/${logFileName}`;
    this.HostBrowserService.get(filePath)
      .then((data) => {
        var downloadData = new Blob([data.file], {
          type: 'text/plain;charset=utf-8',
        });
        this.FileSaver.saveAs(downloadData, logFileName);
      })
      .catch((err) => {
        this.Notifications.error('Failure', err, 'Unable to download file');
      })
      .finally(() => {
        this.EndpointProvider.setEndpointID(currentId);
      });
  }

  associateEndpointsToTasks(tasks, endpoints) {
    return _.map(tasks, (task) => {
      const endpoint = _.find(endpoints, (endpoint) => endpoint.Id === task.EndpointId);
      task.Endpoint = endpoint;
      return task;
    });
  }

  async $onInit() {
    const { id } = this.$state.params;
    try {
      const data = await this.$q.all({
        edgeJob: this.EdgeJobService.edgeJob(id),
        file: this.EdgeJobService.getScriptFile(id),
        tasks: this.EdgeJobService.scriptExecutionTasks(id),
        groups: this.GroupService.groups(),
        tags: this.TagService.tags(),
      });
      var edgeJob = data.edgeJob;
      edgeJob.FileContent = data.file.FileContent;
      this.edgeJob = edgeJob;
      this.groups = data.groups;
      this.tags = data.tags;
      let tasks = data.tasks;
      if (tasks.length > 0) {
        const endpointIds = _.map(tasks, (task) => task.EndpointId);
        const endpoints = await this.EndpointService.endpoints(undefined, undefined, { endpointIds });
        tasks = this.associateEndpointsToTasks(tasks, endpoints.value);
      }
      this.tasks = tasks;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve endpoint list');
    }
  }
}

angular.module('portainer.edge').controller('EdgeJobController', EdgeJobController);
export default EdgeJobController;
