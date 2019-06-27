import Chart from 'chart.js';
import filesize from 'filesize';

angular.module('portainer.integrations.storidge')
.factory('StoridgeChartService', [function StoridgeChartService() {
  'use strict';

  // Max. number of items to display on a chart
  var CHART_LIMIT = 600;

  var service = {};

  service.CreateCapacityChart = function(context) {
    return new Chart(context, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [],
            backgroundColor: [
              'rgba(171, 213, 255, 0.7)',
              'rgba(229, 57, 53, 0.7)'
            ]
          }
        ],
        labels: []
      },
      options: {
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              var dataset = data.datasets[tooltipItem.datasetIndex];
              var label = data.labels[tooltipItem.index];
              var value = dataset.data[tooltipItem.index];
              return label + ': ' + filesize(value, {base: 10, round: 1});
            }
          }
        },
        animation: {
          duration: 0
        },
        responsiveAnimationDuration: 0,
        responsive: true,
        hover: {
          animationDuration: 0
        }
      }
    });
  };

  service.CreateIOPSChart = function(context) {
    return new Chart(context, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'IOPS',
            data: [],
            fill: true,
            backgroundColor: 'rgba(151,187,205,0.4)',
            borderColor: 'rgba(151,187,205,0.6)',
            pointBackgroundColor: 'rgba(151,187,205,1)',
            pointBorderColor: 'rgba(151,187,205,1)',
            pointRadius: 2,
            borderWidth: 2
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
          position: 'nearest'
        },
        hover: {
          animationDuration: 0
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              }
            }
          ]
        }
      }
    });
  };

  service.CreateBandwidthChart = function(context) {
    return new Chart(context, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Bandwidth',
            data: [],
            fill: true,
            backgroundColor: 'rgba(151,187,205,0.4)',
            borderColor: 'rgba(151,187,205,0.6)',
            pointBackgroundColor: 'rgba(151,187,205,1)',
            pointBorderColor: 'rgba(151,187,205,1)',
            pointRadius: 2,
            borderWidth: 2
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
          position: 'nearest',
          callbacks: {
            label: function(tooltipItem, data) {
              var datasetLabel = data.datasets[tooltipItem.datasetIndex].label;
              return bytePerSecBasedTooltipLabel(datasetLabel, tooltipItem.yLabel);
            }
          }
        },
        hover: {
          animationDuration: 0
        },
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                callback: bytePerSecBasedAxisLabel
              }
            }
          ]
        }
      }
    });
  };

  service.UpdateChart = function(label, value, chart) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);

    if (chart.data.datasets[0].data.length > CHART_LIMIT) {
      chart.data.labels.pop();
      chart.data.datasets[0].data.pop();
    }

    chart.update(0);
  };

  service.UpdatePieChart = function(label, value, chart) {
    var idx = chart.data.labels.indexOf(label);
    if (idx > -1) {
      chart.data.datasets[0].data[idx] = value;
    } else {
      chart.data.labels.push(label);
      chart.data.datasets[0].data.push(value);
    }

    chart.update(0);
  };

  function bytePerSecBasedTooltipLabel(label, value) {
    var processedValue = 0;
    if (value > 5) {
      processedValue = filesize(value, {base: 10, round: 1});
    } else {
      processedValue = value.toFixed(1) + 'B';
    }
    return label + ': ' + processedValue + '/s';
  }

  function bytePerSecBasedAxisLabel(value) {
    if (value > 5) {
      return filesize(value, {base: 10, round: 1});
    }
    return value.toFixed(1) + 'B/s';
  }

  return service;
}]);
