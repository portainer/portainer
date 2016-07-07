angular.module('dashboard', [])
.controller('DashboardController', ['$scope', 'Config', 'Container', 'Image', 'Settings', 'LineChart',
function ($scope, Config, Container, Image, Settings, LineChart) {

  $scope.containerData = {};

  var buildCharts = function (data) {
    $scope.containerData.total = data.length;
    LineChart.build('#containers-started-chart', data, function (c) {
      return new Date(c.Created * 1000).toLocaleDateString();
    });
    var s = $scope;
    Image.query({}, function (d) {
      s.totalImages = d.length;
      LineChart.build('#images-created-chart', d, function (c) {
        return new Date(c.Created * 1000).toLocaleDateString();
      });
    });
  };

  function fetchDashboardData() {
    Container.query({all: 1}, function (d) {
      var running = 0;
      var ghost = 0;
      var stopped = 0;

      var containers = d;
      if (hiddenLabels) {
        containers = hideContainers(d);
      }

      for (var i = 0; i < containers.length; i++) {
        var item = containers[i];
        if (item.Status === "Ghost") {
          ghost += 1;
        } else if (item.Status.indexOf('Exit') !== -1) {
          stopped += 1;
        } else {
          running += 1;
        }
      }
      $scope.containerData.running = running;
      $scope.containerData.stopped = stopped;
      $scope.containerData.ghost = ghost;

      buildCharts(containers);
    });
  }

  var hideContainers = function (containers) {
    return containers.filter(function (container) {
      var filterContainer = false;
      hiddenLabels.forEach(function(label, index) {
        if (_.has(container.Labels, label.name) &&
        container.Labels[label.name] === label.value) {
          filterContainer = true;
        }
      });
      if (!filterContainer) {
        return container;
      }
    });
  };

  Config.$promise.then(function (c) {
    hiddenLabels = c.hiddenLabels;
    fetchDashboardData();
  });
}]);
