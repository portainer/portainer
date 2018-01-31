angular.module('portainer.app')
.factory('ChartService', [function ChartService() {
  'use strict';

  // Max. number of items to display on a chart
  var CHART_LIMIT = 600;

  var service = {};

  function defaultChartOptions(pos, tooltipCallback, scalesCallback) {
    return {
        animation: { duration: 0 },
        responsiveAnimationDuration: 0,
        responsive: true,
        tooltips: {
          mode: 'index',
          intersect: false,
          position: pos,
          callbacks: {
            label: function(tooltipItem, data) {
              var datasetLabel = data.datasets[tooltipItem.datasetIndex].label;
              return tooltipCallback(datasetLabel, tooltipItem.yLabel);
            }
          }
        },
        hover: { animationDuration: 0 },
        scales: {
          yAxes: [{
              ticks: {
                beginAtZero: true,
                callback: scalesCallback
              }
          }]
        }
      };
  }

  function CreateChart (context, label, tooltipCallback, scalesCallback) {
    return new Chart(context, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: label,
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
      options: defaultChartOptions('nearest', tooltipCallback, scalesCallback)
    });
  }

  service.CreateCPUChart = function(context) {
    return CreateChart(context, 'CPU', percentageBasedTooltipLabel, percentageBasedAxisLabel);
  };

  service.CreateMemoryChart = function(context) {
    return  CreateChart(context, 'Memory', byteBasedTooltipLabel, byteBasedAxisLabel);
  };

  service.CreateNetworkChart = function(context) {
    return new Chart(context, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'RX on eth0',
            data: [],
            fill: false,
            backgroundColor: 'rgba(151,187,205,0.4)',
            borderColor: 'rgba(151,187,205,0.6)',
            pointBackgroundColor: 'rgba(151,187,205,1)',
            pointBorderColor: 'rgba(151,187,205,1)',
            pointRadius: 2,
            borderWidth: 2
          },
          {
            label: 'TX on eth0',
            data: [],
            fill: false,
            backgroundColor: 'rgba(255,180,174,0.4)',
            borderColor: 'rgba(255,180,174,0.6)',
            pointBackgroundColor: 'rgba(255,180,174,1)',
            pointBorderColor: 'rgba(255,180,174,1)',
            pointRadius: 2,
            borderWidth: 2
          }
        ]
      },
      options: defaultChartOptions('average', byteBasedTooltipLabel, byteBasedAxisLabel)
    });
  };

  function UpdateChart(label, value, chart) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);

    if (chart.data.datasets[0].data.length > CHART_LIMIT) {
      chart.data.labels.pop();
      chart.data.datasets[0].data.pop();
    }

    chart.update(0);
  }

  service.UpdateMemoryChart = UpdateChart;
  service.UpdateCPUChart = UpdateChart;

  service.UpdateNetworkChart = function(label, rx, tx, chart) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(rx);
    chart.data.datasets[1].data.push(tx);

    if (chart.data.datasets[0].data.length > CHART_LIMIT) {
      chart.data.labels.pop();
      chart.data.datasets[0].data.pop();
      chart.data.datasets[1].data.pop();
    }

    chart.update(0);
  };

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

  return service;
}]);
