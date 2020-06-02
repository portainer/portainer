import angular from 'angular';
import _ from 'lodash-es';

class EdgeJobController {
  constructor($async, $q, $state, EdgeJobService, EndpointService, FileSaver, GroupService, HostBrowserService, Notifications, TagService) {
    this.state = {
      actionInProgress: false,
    };

    this.$async = $async;
    this.$q = $q;
    this.$state = $state;
    this.EdgeJobService = EdgeJobService;
    this.EndpointService = EndpointService;
    this.FileSaver = FileSaver;
    this.GroupService = GroupService;
    this.HostBrowserService = HostBrowserService;
    this.Notifications = Notifications;
    this.TagService = TagService;

    this.update = this.update.bind(this);
    this.updateAsync = this.updateAsync.bind(this);
    this.downloadLogs = this.downloadLogs.bind(this);
    this.downloadLogsAsync = this.downloadLogsAsync.bind(this);
    this.collectLogs = this.collectLogs.bind(this);
    this.collectLogsAsync = this.collectLogsAsync.bind(this);
    this.clearLogs = this.clearLogs.bind(this);
    this.clearLogsAsync = this.clearLogsAsync.bind(this);
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

  downloadLogs(endpointId) {
    return this.$async(this.downloadLogsAsync, endpointId);
  }
  async downloadLogsAsync(endpointId) {
    try {
      const data = await this.EdgeJobService.logFile(this.edgeJob.Id, endpointId);
      const downloadData = new Blob([data.FileContent], {
        type: 'text/plain;charset=utf-8',
      });
      const logFileName = `job_${this.edgeJob.Id}_task_${endpointId}.log`;
      this.FileSaver.saveAs(downloadData, logFileName);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to download file');
    }
  }

  associateEndpointsToTasks(tasks, endpoints) {
    return _.map(tasks, (task) => {
      const endpoint = _.find(endpoints, (endpoint) => endpoint.Id === task.EndpointId);
      task.Endpoint = endpoint;
      return task;
    });
  }

  collectLogs(endpointId) {
    return this.$async(this.collectLogsAsync, endpointId);
  }

  async collectLogsAsync(endpointId) {
    try {
      await this.EdgeJobService.collectLogs(this.edgeJob.Id, endpointId);
      const task = _.find(this.tasks, (task) => task.EndpointId === endpointId);
      task.LogsStatus = 2;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to collect logs');
    }
  }

  clearLogs(endpointId) {
    return this.$async(this.clearLogsAsync, endpointId);
  }
  async clearLogsAsync(endpointId) {
    try {
      await this.EdgeJobService.clearLogs(this.edgeJob.Id, endpointId);
      const task = _.find(this.tasks, (task) => task.EndpointId === endpointId);
      task.LogsStatus = 1;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to clear logs');
    }
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
