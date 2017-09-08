angular.module('containerStats', [])
.controller('ContainerStatsController', ['$q', '$scope', '$stateParams', '$document', '$interval', 'ContainerService', 'Notifications', 'Pagination',
function ($q, $scope, $stateParams, $document, $interval, ContainerService, Notifications, Pagination) {

  $scope.state = {
    refreshRate: '5'
  };

  $scope.state.pagination_count = Pagination.getPaginationCount('stats_processes');
  $scope.sortType = 'CMD';
  $scope.sortReverse = false;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('stats_processes', $scope.state.pagination_count);
  };

  $scope.$on('$destroy', function() {
    var repeater = $scope.repeater;
    stopRepeater(repeater);
  });

  function stopRepeater(repeater) {
    if (angular.isDefined(repeater)) {
      $interval.cancel(repeater);
      repeater = null;
    }
  }

  function updateNetworkChart(stats, chart) {
    var rx = stats.Networks[0].rx_bytes;
    var tx = stats.Networks[0].tx_bytes;
    chart.data.labels.push(moment(stats.Date).format('HH:mm:ss'));
    chart.data.datasets[0].data.push(rx);
    chart.data.datasets[1].data.push(tx);

    if (chart.data.datasets[0].data.length > 600) {
      chart.data.labels.pop();
      chart.data.datasets[0].data.pop();
      chart.data.datasets[1].data.pop();
    }

    chart.update(0);
  }

  function updateCPUMemoryChart(stats, chart) {
    chart.data.labels.push(moment(stats.Date).format('HH:mm:ss'));
    chart.data.datasets[0].data.push(stats.MemoryUsage);
    chart.data.datasets[1].data.push(calculateCPUPercentUnix(stats));

    if (chart.data.datasets[0].data.length > 600) {
      chart.data.labels.pop();
      chart.data.datasets[0].data.pop();
      chart.data.datasets[1].data.pop();
    }

    chart.update(0);
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

  function updateCharts(networkChart, cpuMemoryChart) {
    $('#loadingViewSpinner').show();
    $q.all({
      stats: ContainerService.containerStats($stateParams.id),
      top: ContainerService.containerTop($stateParams.id)
    })
    .then(function success(data) {
      var stats = data.stats;
      $scope.processInfo = data.top;
      updateNetworkChart(stats, networkChart);
      updateCPUMemoryChart(stats, cpuMemoryChart);
      setUpdateRepeater(networkChart, cpuMemoryChart);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve container statistics');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  $scope.changeUpdateRepeater = function() {
    var refreshRate = $scope.state.refreshRate;
    var repeater = $scope.repeater;
    stopRepeater(repeater);

    var networkChart = $scope.networkChart;
    var cpuMemoryChart = $scope.cpuMemoryChart;

    $scope.repeater = $interval(function() {
      $q.all({
        stats: ContainerService.containerStats($stateParams.id),
        top: ContainerService.containerTop($stateParams.id)
      })
      .then(function success(data) {
        var stats = data.stats;
        $scope.processInfo = data.top;
        updateNetworkChart(stats, networkChart);
        updateCPUMemoryChart(stats, cpuMemoryChart);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve container statistics');
      });
    }, refreshRate * 1000);
    $('#refreshRateChange').show();
    $('#refreshRateChange').fadeOut(1500);
  };

  function setUpdateRepeater(networkChart, cpuMemoryChart) {
    var refreshRate = $scope.state.refreshRate;
    $scope.repeater = $interval(function() {
      $q.all({
        stats: ContainerService.containerStats($stateParams.id),
        top: ContainerService.containerTop($stateParams.id)
      })
      .then(function success(data) {
        var stats = data.stats;
        $scope.processInfo = data.top;
        updateNetworkChart(stats, networkChart);
        updateCPUMemoryChart(stats, cpuMemoryChart);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to retrieve container statistics');
      });
    }, refreshRate * 1000);
  }

  function byteBasedTooltipLabel(label, value) {
    var processedValue = 0;
    if (value > 5) {
      processedValue = filesize(value, {base: 10, round: 1});
    } else {
      processedValue = value.toFixed(1) + 'B';
    }
    return label + ': ' + processedValue;
  }

  function byteBasedAxisLabel(value, index, values) {
    if (value > 5) {
      return filesize(value, {base: 10, round: 1});
    }
    return value.toFixed(1) + 'B';
  }

  function percentageBasedAxisLabel(value, index, values) {
    if (value > 1) {
      return Math.round(value) + '%';
    }
    return value.toFixed(1) + '%';
  }

  function percentageBasedTooltipLabel(label, value) {
    var processedValue = 0;
    if (value > 1) {
      processedValue = Math.round(value);
    } else {
      processedValue = value.toFixed(1);
    }
    return label + ': ' + processedValue + '%';
  }

  function initCharts() {
    var networkChartCtx = $('#networkChart');
    var networkChart = new Chart(networkChartCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'RX on eth0',
            data: [],
            fill: false,
            backgroundColor: 'rgba(151,187,205,0.5)',
            borderColor: 'rgba(151,187,205,0.7)',
            pointBackgroundColor: 'rgba(151,187,205,1)',
            pointBorderColor: 'rgba(151,187,205,1)'
          },
          {
            label: 'TX on eth0',
            data: [],
            fill: false,
            backgroundColor: 'rgba(255,180,174,0.5)',
            borderColor: 'rgba(255,180,174,0.7)',
            pointBackgroundColor: 'rgba(255,180,174,1)',
            pointBorderColor: 'rgba(255,180,174,1)'
          }
        ]
      },
      options: {
        animation: {
          duration: 0
        },
        responsiveAnimationDuration: 0,
        responsive: true,
        tooltips: {
          mode: 'index',
          intersect: false,
          position: 'average',
          callbacks: {
            label: function(tooltipItem, data) {
              var datasetLabel = data.datasets[tooltipItem.datasetIndex].label;
              return byteBasedTooltipLabel(datasetLabel, tooltipItem.yLabel);
            }
          }
        },
        hover: {
          mode: 'average',
          animationDuration: 0,
          intersect: true
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true,
              callback: byteBasedAxisLabel
            }
          }]
        }
      }
    });
    $scope.networkChart = networkChart;

    var cpuMemoryChartCtx = $('#cpuMemoryChart');
    var cpuMemoryChart = new Chart(cpuMemoryChartCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Memory',
            data: [],
            fill: false,
            backgroundColor: 'rgba(151,187,205,0.5)',
            borderColor: 'rgba(151,187,205,0.7)',
            pointBackgroundColor: 'rgba(151,187,205,1)',
            pointBorderColor: 'rgba(151,187,205,1)',
            yAxisID: 'memory-axis'
          },
          {
            label: 'CPU',
            data: [],
            fill: false,
            backgroundColor: 'rgba(255,180,174,0.5)',
            borderColor: 'rgba(255,180,174,0.7)',
            pointBackgroundColor: 'rgba(255,180,174,1)',
            pointBorderColor: 'rgba(255,180,174,1)',
            yAxisID: 'cpu-axis'
          }
        ]
      },
      options: {
        animation: {
          duration: 0
        },
        responsiveAnimationDuration: 0,
        responsive: true,
        tooltips: {
          mode: 'index',
          intersect: false,
          position: 'average',
          callbacks: {
            label: function(tooltipItem, data) {
              var datasetLabel = data.datasets[tooltipItem.datasetIndex].label;
              if (tooltipItem.datasetIndex === 0) {
                return byteBasedTooltipLabel(datasetLabel, tooltipItem.yLabel);
              } else {
                return percentageBasedTooltipLabel(datasetLabel, tooltipItem.yLabel);
              }
            }
          }
        },
        hover: {
          mode: 'average',
          animationDuration: 0,
          intersect: true
        },
        scales: {
          yAxes: [
            {
              position: 'left',
              id: 'memory-axis',
              scaleLabel: {
                display: true,
                labelString: 'Memory usage'
              },
              ticks: {
                beginAtZero: true,
                callback: byteBasedAxisLabel
              }
            },
            {
              position: 'right',
              id: 'cpu-axis',
              scaleLabel: {
                display: true,
                labelString: 'CPU usage'
              },
              ticks: {
                beginAtZero: true,
                callback: percentageBasedAxisLabel
              }
            }
          ]
        }
      }
    });
    $scope.cpuMemoryChart = cpuMemoryChart;

    updateCharts(networkChart, cpuMemoryChart);
  }

  function initView() {
    $('#loadingViewSpinner').show();

    ContainerService.container($stateParams.id)
    .then(function success(data) {
      $scope.container = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve container information');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });

    $document.ready(function() {
      initCharts();
    });
  }

  initView();
}]);
