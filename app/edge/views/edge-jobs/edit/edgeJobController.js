import angular from 'angular';
import _ from 'lodash-es';

class EdgeJobController {
  constructor($async, $q, $state, EdgeJobService, EndpointProvider, EndpointService, FileSaver, GroupService, HostBrowserService, Notifications, TagService) {
    this.state = {
      actionInProgress: false,
    };

    this.$async = $async;
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
    this.updateAsync = this.updateAsync.bind(this);
    this.getTaskLogs = this.getTaskLogs.bind(this);
    this.getTaskLogsAsync = this.getTaskLogsAsync.bind(this);
  }

  update() {
    return this.$async(this.updateAsync);
  }

  async updateAsync() {
    const model = this.edgeJob;
    this.state.actionInProgress = true;

    try {
      await this.EdgeJobService.updateEdgeJob(model);
      this.Notifications.success('Edge job successfully updated');
      this.$state.go('edge.jobs', {}, { reload: true });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to update Edge job');
    }

    this.state.actionInProgress = false;
  }

  getTaskLogs(endpointId, edgeJob) {
    return this.$async(this.getTaskLogsAsync, endpointId, edgeJob);
  }

  async getTaskLogsAsync(endpointId, edgeJob) {
    const currentId = this.EndpointProvider.endpointID();
    this.EndpointProvider.setEndpointID(endpointId);
    const logFileName = `${edgeJob}.log`;
    const filePath = `/host/opt/portainer/scripts/${logFileName}`;

    try {
      const data = await this.HostBrowserService.get(filePath);
      const downloadData = new Blob([data.file], {
        type: 'text/plain;charset=utf-8',
      });
      this.FileSaver.saveAs(downloadData, logFileName);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to download file');
    }

    this.EndpointProvider.setEndpointID(currentId);
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
      const [edgeJob, file, tasks, groups, tags] = await Promise.all([
        this.EdgeJobService.edgeJob(id),
        this.EdgeJobService.getScriptFile(id),
        this.EdgeJobService.tasks(id),
        this.GroupService.groups(),
        this.TagService.tags(),
      ]);

      edgeJob.FileContent = file.FileContent;
      this.edgeJob = edgeJob;
      this.groups = groups;
      this.tags = tags;

      if (tasks.length > 0) {
        const endpointIds = _.map(tasks, (task) => task.EndpointId);
        const endpoints = await this.EndpointService.endpoints(undefined, undefined, { endpointIds });
        this.tasks = this.associateEndpointsToTasks(tasks, endpoints.value);
      } else {
        this.tasks = tasks;
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve endpoint list');
    }
  }
}

angular.module('portainer.edge').controller('EdgeJobController', EdgeJobController);
export default EdgeJobController;
