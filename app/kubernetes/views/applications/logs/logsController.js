import angular from 'angular';
import _ from 'lodash-es';

class KubernetesApplicationLogsController {
  /* @ngInject */
  constructor($async, $state, $interval, Notifications, KubernetesApplicationService, KubernetesPodService, Blob, FileSaver) {
    this.$async = $async;
    this.$state = $state;
    this.$interval = $interval;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesPodService = KubernetesPodService;
    this.Blob = Blob;
    this.FileSaver = FileSaver;

    this.onInit = this.onInit.bind(this);
    this.stopRepeater = this.stopRepeater.bind(this);
    this.getApplicationLogsAsync = this.getApplicationLogsAsync.bind(this);
  }

  updateAutoRefresh() {
    if (this.state.autoRefresh) {
      this.setUpdateRepeater();
      return;
    }

    this.stopRepeater();
  }

  stopRepeater() {
    if (angular.isDefined(this.repeater)) {
      this.$interval.cancel(this.repeater);
      this.repeater = null;
    }
  }

  setUpdateRepeater() {
    this.repeater = this.$interval(this.getApplicationLogsAsync, this.state.refreshRate);
  }

  downloadLogs() {
    const data = new this.Blob([_.reduce(this.applicationLogs, (acc, log) => acc + '\n' + log, '')]);
    this.FileSaver.saveAs(data, this.podName + '_logs.txt');
  }

  async getApplicationLogsAsync() {
    try {
      this.applicationLogs = await this.KubernetesPodService.logs(this.application.ResourcePool, this.podName, this.containerName);
    } catch (err) {
      this.stopRepeater();
      this.Notifications.error('Failure', err, 'Unable to retrieve application logs');
    }
  }

  async onInit() {
    this.state = {
      autoRefresh: false,
      refreshRate: 5000, // 5 seconds
      search: '',
      viewReady: false,
    };

    const podName = this.$transition$.params().pod;
    const applicationName = this.$transition$.params().name;
    const namespace = this.$transition$.params().namespace;
    const containerName = this.$transition$.params().container;

    this.applicationLogs = [];
    this.podName = podName;
    this.containerName = containerName;

    try {
      const [application, applicationLogs] = await Promise.all([
        this.KubernetesApplicationService.get(namespace, applicationName),
        this.KubernetesPodService.logs(namespace, podName, containerName),
      ]);

      this.application = application;
      this.applicationLogs = applicationLogs;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve application logs');
    } finally {
      this.state.viewReady = true;
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  $onDestroy() {
    this.stopRepeater();
  }
}

export default KubernetesApplicationLogsController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationLogsController', KubernetesApplicationLogsController);
