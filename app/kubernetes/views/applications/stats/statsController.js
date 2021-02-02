import angular from 'angular';
import moment from 'moment';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import KubernetesPodConverter from 'Kubernetes/pod/converter';

class KubernetesApplicationStatsController {
  /* @ngInject */
  constructor($async, $state, $interval, $document, Notifications, KubernetesPodService, KubernetesNodeService, KubernetesMetricsService, ChartService) {
    this.$async = $async;
    this.$state = $state;
    this.$interval = $interval;
    this.$document = $document;
    this.Notifications = Notifications;
    this.KubernetesPodService = KubernetesPodService;
    this.KubernetesNodeService = KubernetesNodeService;
    this.KubernetesMetricsService = KubernetesMetricsService;
    this.ChartService = ChartService;

    this.onInit = this.onInit.bind(this);
  }

  changeUpdateRepeater() {
    var cpuChart = this.cpuChart;
    var memoryChart = this.memoryChart;

    this.stopRepeater();
    this.setUpdateRepeater(cpuChart, memoryChart);
    $('#refreshRateChange').show();
    $('#refreshRateChange').fadeOut(1500);
  }

  updateCPUChart() {
    const label = moment(this.stats.read).format('HH:mm:ss');

    this.ChartService.UpdateCPUChart(label, this.stats.CPUUsage, this.cpuChart);
  }

  updateMemoryChart() {
    const label = moment(this.stats.read).format('HH:mm:ss');

    this.ChartService.UpdateMemoryChart(label, this.stats.MemoryUsage, this.stats.MemoryCache, this.memoryChart);
  }

  stopRepeater() {
    var repeater = this.repeater;
    if (angular.isDefined(repeater)) {
      this.$interval.cancel(repeater);
      repeater = undefined;
    }
  }

  setUpdateRepeater() {
    const refreshRate = this.state.refreshRate;

    this.repeater = this.$interval(async () => {
      try {
        await this.getStats();

        this.updateCPUChart();
        this.updateMemoryChart();
      } catch (error) {
        this.stopRepeater();
        this.Notifications.error('Failure', error);
      }
    }, refreshRate * 1000);
  }

  initCharts() {
    const cpuChartCtx = $('#cpuChart');
    const cpuChart = this.ChartService.CreateCPUChart(cpuChartCtx);
    this.cpuChart = cpuChart;

    const memoryChartCtx = $('#memoryChart');
    const memoryChart = this.ChartService.CreateMemoryChart(memoryChartCtx);
    this.memoryChart = memoryChart;

    this.updateCPUChart();
    this.updateMemoryChart();
    this.setUpdateRepeater();
  }

  getStats() {
    return this.$async(async () => {
      try {
        const stats = await this.KubernetesMetricsService.getPod(this.state.transition.namespace, this.state.transition.podName);
        const container = _.find(stats.containers, { name: this.state.transition.containerName });
        if (container) {
          const memory = filesizeParser(container.usage.memory);
          const cpu = KubernetesResourceReservationHelper.parseCPU(container.usage.cpu);
          this.stats = {
            read: stats.timestamp,
            preread: '',
            MemoryCache: 0,
            MemoryUsage: memory,
            NumProcs: '',
            isWindows: false,
            PreviousCPUTotalUsage: 0,
            CPUUsage: (cpu / this.nodeCPU) * 100,
            CPUCores: 0,
          };
        }
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve application stats');
      }
    });
  }

  $onDestroy() {
    this.stopRepeater();
  }

  async onInit() {
    this.state = {
      autoRefresh: false,
      refreshRate: '30',
      viewReady: false,
      transition: {
        podName: this.$transition$.params().pod,
        containerName: this.$transition$.params().container,
        namespace: this.$transition$.params().namespace,
        applicationName: this.$transition$.params().name,
      },
      getMetrics: false,
    };

    try {
      await this.KubernetesMetricsService.getPod(this.state.transition.namespace, this.state.transition.podName);
    } catch (error) {
      this.state.getMetrics = false;
      this.state.viewReady = true;
      return;
    }

    try {
      const podRaw = await this.KubernetesPodService.get(this.state.transition.namespace, this.state.transition.podName);
      const pod = KubernetesPodConverter.apiToModel(podRaw.Raw);
      if (pod) {
        const node = await this.KubernetesNodeService.get(pod.Node);
        this.nodeCPU = node.CPU;
      } else {
        throw new Error('Unable to find pod');
      }
      await this.getStats();
      this.state.getMetrics = true;

      this.$document.ready(() => {
        this.initCharts();
      });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve application stats');
    } finally {
      this.state.viewReady = true;
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesApplicationStatsController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationStatsController', KubernetesApplicationStatsController);
