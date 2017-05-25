angular.module('portainer.services')
.factory('LineChart', ['Settings', function LineChartFactory(Settings) {
  'use strict';
  return {
    build: function (id, data, getkey) {
      var chart = new Chart($(id).get(0).getContext('2d'));
      var map = {};

      for (var i = 0; i < data.length; i++) {
        var c = data[i];
        var key = getkey(c);

        var count = map[key];
        if (count === undefined) {
          count = 0;
        }
        count += 1;
        map[key] = count;
      }

      var labels = [];
      data = [];
      var keys = Object.keys(map);
      var max = 1;

      for (i = keys.length - 1; i > -1; i--) {
        var k = keys[i];
        labels.push(k);
        data.push(map[k]);
        if (map[k] > max) {
          max = map[k];
        }
      }
      var steps = Math.min(max, 10);
      var dataset = {
        fillColor: 'rgba(151,187,205,0.5)',
        strokeColor: 'rgba(151,187,205,1)',
        pointColor: 'rgba(151,187,205,1)',
        pointStrokeColor: '#fff',
        data: data
      };
      chart.Line({
        labels: labels,
        datasets: [dataset]
      },
      {
        scaleStepWidth: Math.ceil(max / steps),
        pointDotRadius: 1,
        scaleIntegersOnly: true,
        scaleOverride: true,
        scaleSteps: steps
      });
    }
  };
}]);
