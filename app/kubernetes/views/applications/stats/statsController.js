import angular from 'angular';
import moment from 'moment';
import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';

class KubernetesApplicationStatsController {
  /* @ngInject */
  constructor($async, $state, $interval, $document, Notifications, KubernetesApplicationService, KubernetesPodService, ChartService) {
    this.$async = $async;
    this.$state = $state;
    this.$interval = $interval;
    this.$document = $document;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesPodService = KubernetesPodService;
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

  updateCPUChart(stats, chart) {
    const label = moment(stats.read).format('HH:mm:ss');

    this.ChartService.UpdateCPUChart(label, stats.CPUUsage, chart);
  }

  updateMemoryChart(stats, chart) {
    const label = moment(stats.read).format('HH:mm:ss');

    this.ChartService.UpdateMemoryChart(label, stats.MemoryUsage, stats.MemoryCache, chart);
  }

  stopRepeater() {
    var repeater = this.repeater;
    if (angular.isDefined(repeater)) {
      this.$interval.cancel(repeater);
      repeater = null;
    }
  }

  setUpdateRepeater(cpuChart, memoryChart) {
    const refreshRate = this.state.refreshRate;

    this.repeater = this.$interval(async () => {
      try {
        await this.getStats();

        this.updateCPUChart(this.stats, cpuChart);
        this.updateMemoryChart(this.stats, memoryChart);
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

    this.updateCPUChart(this.stats, this.cpuChart);
    this.updateMemoryChart(this.stats, this.memoryChart);
    this.setUpdateRepeater(this.cpuChart, this.memoryChart);
  }

  getStats() {
    return this.$async(async () => {
      try {
        const stats = await this.KubernetesPodService.stats(this.namespace, this.podName);
        const container = _.find(stats.containers, { name: this.containerName });
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
            CPUUsage: cpu,
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
      refreshRate: '5',
      viewReady: false,
    };

    const podName = this.$transition$.params().pod;
    const containerName = this.$transition$.params().container;
    const namespace = this.$transition$.params().namespace;
    const applicationName = this.$transition$.params().name;

    this.namespace = namespace;
    this.podName = podName;
    this.containerName = containerName;

    try {
      this.application = await this.KubernetesApplicationService.get(namespace, applicationName);
      await this.getStats();

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
