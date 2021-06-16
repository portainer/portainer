import angular from 'angular';
import moment from 'moment';
import filesizeParser from 'filesize-parser';
import KubernetesResourceReservationHelper from 'Kubernetes/helpers/resourceReservationHelper';
import { PORTAINER_FADEOUT } from '@/constants';

class KubernetesNodeStatsController {
  /* @ngInject */
  constructor($async, $state, $interval, $document, Notifications, KubernetesNodeService, KubernetesMetricsService, ChartService) {
    this.$async = $async;
    this.$state = $state;
    this.$interval = $interval;
    this.$document = $document;
    this.Notifications = Notifications;
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
    $('#refreshRateChange').fadeOut(PORTAINER_FADEOUT);
  }

  updateCPUChart() {
    const label = moment(this.stats.read).format('HH:mm:ss');
    this.ChartService.UpdateCPUChart(label, this.stats.CPUUsage, this.cpuChart);
  }

  updateMemoryChart() {
    const label = moment(this.stats.read).format('HH:mm:ss');
    this.ChartService.UpdateMemoryChart(label, this.stats.MemoryUsage, 0, this.memoryChart);
  }

  stopRepeater() {
    var repeater = this.repeater;
    if (angular.isDefined(repeater)) {
      this.$interval.cancel(repeater);
      this.repeater = undefined;
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
        const stats = await this.KubernetesMetricsService.getNode(this.state.transition.nodeName);
        if (stats) {
          const memory = filesizeParser(stats.usage.memory);
          const cpu = KubernetesResourceReservationHelper.parseCPU(stats.usage.cpu);
          this.stats = {
            read: stats.creationTimestamp,
            MemoryUsage: memory,
            CPUUsage: (cpu / this.nodeCPU) * 100,
          };
        }
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve node stats');
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
        nodeName: this.$transition$.params().name,
      },
      getMetrics: true,
    };

    try {
      const nodeMetrics = await this.KubernetesMetricsService.getNode(this.state.transition.nodeName);

      if (nodeMetrics) {
        const node = await this.KubernetesNodeService.get(this.state.transition.nodeName);
        this.nodeCPU = node.CPU || 1;

        await this.getStats();

        if (this.state.getMetrics) {
          this.$document.ready(() => {
            this.initCharts();
          });
        }
      } else {
        this.state.getMetrics = false;
      }
    } catch (err) {
      this.state.getMetrics = false;
      this.Notifications.error('Failure', err, 'Unable to retrieve node stats');
    } finally {
      this.state.viewReady = true;
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesNodeStatsController;
angular.module('portainer.kubernetes').controller('KubernetesNodeStatsController', KubernetesNodeStatsController);
