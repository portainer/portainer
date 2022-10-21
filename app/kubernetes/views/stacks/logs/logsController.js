import { filter, flatMap, map } from 'lodash';
import angular from 'angular';
import $allSettled from 'Portainer/services/allSettled';
import { concatLogsToString, formatLogs } from '@/docker/helpers/logHelper';

const colors = ['red', 'orange', 'lime', 'green', 'darkgreen', 'cyan', 'turquoise', 'teal', 'deepskyblue', 'blue', 'darkblue', 'slateblue', 'magenta', 'darkviolet'];

class KubernetesStackLogsController {
  /* @ngInject */
  constructor($async, $state, $interval, Notifications, KubernetesApplicationService, KubernetesPodService, FileSaver, Blob) {
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
    this.generateLogsPromise = this.generateLogsPromise.bind(this);
    this.generateAppPromise = this.generateAppPromise.bind(this);
    this.getStackLogsAsync = this.getStackLogsAsync.bind(this);
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
    this.repeater = this.$interval(this.getStackLogsAsync, this.state.refreshRate);
  }

  async generateLogsPromise(pod, container) {
    const res = {
      Pod: pod,
      Logs: [],
    };
    res.Logs = await this.KubernetesPodService.logs(pod.Namespace, pod.Name, container.Name);
    return res;
  }

  async generateAppPromise(app) {
    const res = {
      Application: app,
      Pods: [],
    };

    const promises = flatMap(map(app.Pods, (pod) => map(pod.Containers, (container) => this.generateLogsPromise(pod, container))));
    const result = await $allSettled(promises);
    res.Pods = result.fulfilled;
    return res;
  }

  async getStackLogsAsync() {
    try {
      const applications = await this.KubernetesApplicationService.get(this.state.transition.namespace);
      const filteredApplications = filter(applications, (app) => app.StackName === this.state.transition.name);
      const logsPromises = map(filteredApplications, this.generateAppPromise);
      const data = await Promise.all(logsPromises);
      const logs = flatMap(data, (app, index) =>
        flatMap(app.Pods, (pod) => formatLogs(pod.Logs).map((line) => ({ ...line, appColor: colors[index % colors.length], appName: pod.Pod.Name })))
      );
      this.stackLogs = logs;
    } catch (err) {
      this.stopRepeater();
      this.Notifications.error('Failure', err, 'Unable to retrieve application logs');
    }
  }

  downloadLogs() {
    const logsAsString = concatLogsToString(this.state.filteredLogs, (line) => `${line.appName} ${line.line}`);
    const data = new this.Blob([logsAsString]);
    this.FileSaver.saveAs(data, this.state.transition.name + '_logs.txt');
  }

  async onInit() {
    this.state = {
      autoRefresh: false,
      refreshRate: 30000, // 30 seconds
      search: '',
      viewReady: false,
      transition: {
        namespace: this.$transition$.params().namespace,
        name: this.$transition$.params().name,
      },
    };

    this.stackLogs = [];
    try {
      await this.getStackLogsAsync();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve stack logs');
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

export default KubernetesStackLogsController;
angular.module('portainer.kubernetes').controller('KubernetesStackLogsController', KubernetesStackLogsController);
