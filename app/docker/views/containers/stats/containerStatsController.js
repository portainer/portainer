import moment from 'moment';

angular.module('portainer.docker').controller('ContainerStatsController', [
  '$q',
  '$scope',
  '$transition$',
  '$document',
  '$interval',
  'ContainerService',
  'ChartService',
  'Notifications',
  'HttpRequestHelper',
  function ($q, $scope, $transition$, $document, $interval, ContainerService, ChartService, Notifications, HttpRequestHelper) {
    $scope.state = {
      refreshRate: '5',
      networkStatsUnavailable: false,
      ioStatsUnavailable: false,
    };

    $scope.$on('$destroy', function () {
      stopRepeater();
    });

    function stopRepeater() {
      var repeater = $scope.repeater;
      if (angular.isDefined(repeater)) {
        $interval.cancel(repeater);
        repeater = null;
      }
    }

    function updateNetworkChart(stats, chart) {
      if (stats.Networks.length > 0) {
        var rx = stats.Networks[0].rx_bytes;
        var tx = stats.Networks[0].tx_bytes;
        var label = moment(stats.read).format('HH:mm:ss');

        ChartService.UpdateNetworkChart(label, rx, tx, chart);
      }
    }

    function updateMemoryChart(stats, chart) {
      var label = moment(stats.read).format('HH:mm:ss');

      ChartService.UpdateMemoryChart(label, stats.MemoryUsage, stats.MemoryCache, chart);
    }

    function updateIOChart(stats, chart) {
      var label = moment(stats.read).format('HH:mm:ss');
      if (stats.noIOData !== true) {
        ChartService.UpdateIOChart(label, stats.BytesRead, stats.BytesWrite, chart);
      }
    }

    function updateCPUChart(stats, chart) {
      var label = moment(stats.read).format('HH:mm:ss');
      var value = stats.isWindows ? calculateCPUPercentWindows(stats) : calculateCPUPercentUnix(stats);

      ChartService.UpdateCPUChart(label, value, chart);
    }

    function calculateCPUPercentUnix(stats) {
      var cpuPercent = 0.0;
      var cpuDelta = stats.CurrentCPUTotalUsage - stats.PreviousCPUTotalUsage;
      var systemDelta = stats.CurrentCPUSystemUsage - stats.PreviousCPUSystemUsage;

      if (systemDelta > 0.0 && cpuDelta > 0.0) {
        cpuPercent = (cpuDelta / systemDelta) * stats.CPUCores * 100.0;
      }

      return cpuPercent;
    }

    function calculateCPUPercentWindows(stats) {
      var possIntervals =
        stats.NumProcs * parseFloat(moment(stats.read, 'YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ').valueOf() - moment(stats.preread, 'YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ').valueOf());
      var windowsCpuUsage = 0.0;
      if (possIntervals > 0) {
        windowsCpuUsage = parseFloat(stats.CurrentCPUTotalUsage - stats.PreviousCPUTotalUsage) / parseFloat(possIntervals * 100);
      }
      return windowsCpuUsage;
    }

    $scope.changeUpdateRepeater = function () {
      var networkChart = $scope.networkChart;
      var cpuChart = $scope.cpuChart;
      var memoryChart = $scope.memoryChart;
      var ioChart = $scope.ioChart;

      stopRepeater();
      setUpdateRepeater(networkChart, cpuChart, memoryChart, ioChart);
      $('#refreshRateChange').show();
      $('#refreshRateChange').fadeOut(1500);
    };

    function startChartUpdate(networkChart, cpuChart, memoryChart, ioChart) {
      $q.all({
        stats: ContainerService.containerStats($transition$.params().id),
        top: ContainerService.containerTop($transition$.params().id),
      })
        .then(function success(data) {
          var stats = data.stats;
          $scope.processInfo = data.top;
          if (stats.Networks.length === 0) {
            $scope.state.networkStatsUnavailable = true;
          }
          if (stats.noIOData === true) {
            $scope.state.ioStatsUnavailable = true;
          }
          updateNetworkChart(stats, networkChart);
          updateMemoryChart(stats, memoryChart);
          updateCPUChart(stats, cpuChart);
          updateIOChart(stats, ioChart);
          setUpdateRepeater(networkChart, cpuChart, memoryChart, ioChart);
        })
        .catch(function error(err) {
          stopRepeater();
          Notifications.error('Failure', err, 'Unable to retrieve container statistics');
        });
    }

    function setUpdateRepeater(networkChart, cpuChart, memoryChart, ioChart) {
      var refreshRate = $scope.state.refreshRate;
      $scope.repeater = $interval(function () {
        $q.all({
          stats: ContainerService.containerStats($transition$.params().id),
          top: ContainerService.containerTop($transition$.params().id),
        })
          .then(function success(data) {
            var stats = data.stats;
            $scope.processInfo = data.top;
            updateNetworkChart(stats, networkChart);
            updateMemoryChart(stats, memoryChart);
            updateCPUChart(stats, cpuChart);
            updateIOChart(stats, ioChart);
          })
          .catch(function error(err) {
            stopRepeater();
            Notifications.error('Failure', err, 'Unable to retrieve container statistics');
          });
      }, refreshRate * 1000);
    }

    function initCharts() {
      var networkChartCtx = $('#networkChart');
      var networkChart = ChartService.CreateNetworkChart(networkChartCtx);
      $scope.networkChart = networkChart;

      var cpuChartCtx = $('#cpuChart');
      var cpuChart = ChartService.CreateCPUChart(cpuChartCtx);
      $scope.cpuChart = cpuChart;

      var memoryChartCtx = $('#memoryChart');
      var memoryChart = ChartService.CreateMemoryChart(memoryChartCtx);
      $scope.memoryChart = memoryChart;

      var ioChartCtx = $('#ioChart');
      var ioChart = ChartService.CreateIOChart(ioChartCtx);
      $scope.ioChart = ioChart;

      startChartUpdate(networkChart, cpuChart, memoryChart, ioChart);
    }

    function initView() {
      HttpRequestHelper.setPortainerAgentTargetHeader($transition$.params().nodeName);
      ContainerService.container($transition$.params().id)
        .then(function success(data) {
          $scope.container = data;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve container information');
        });

      $document.ready(function () {
        initCharts();
      });
    }

    initView();
  },
]);
