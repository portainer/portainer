angular.module('dashboard', [])
.controller('DashboardController', ['$scope', '$q', 'Config', 'Container', 'Image', 'Network', 'Volume', 'Info',
function ($scope, $q, Config, Container, Image, Network, Volume, Info) {

  $scope.containerData = {
    total: 0
  };
  $scope.imageData = {
    total: 0
  };
  $scope.networkData = {
    total: 0
  };
  $scope.volumeData = {
    total: 0
  };

  function prepareContainerData(d) {
    var running = 0;
    var stopped = 0;

    var containers = d;
    if (hiddenLabels) {
      containers = hideContainers(d);
    }

    for (var i = 0; i < containers.length; i++) {
      var item = containers[i];
      if (item.Status.indexOf('Up') !== -1) {
        running += 1;
      } else if (item.Status.indexOf('Exit') !== -1) {
        stopped += 1;
      }
    }
    $scope.containerData.running = running;
    $scope.containerData.stopped = stopped;
    $scope.containerData.total = containers.length;
  }

  function prepareImageData(d) {
    var images = d;
    var totalImageSize = 0;
    for (var i = 0; i < images.length; i++) {
      var item = images[i];
      totalImageSize += item.VirtualSize;
    }
    $scope.imageData.total = images.length;
    $scope.imageData.size = totalImageSize;
  }

  function prepareVolumeData(d) {
    var volumes = d.Volumes;
    $scope.volumeData.total = volumes.length;
  }

  function prepareNetworkData(d) {
    var networks = d;
    $scope.networkData.total = networks.length;
  }

  function prepareInfoData(d) {
    var info = d;
    $scope.infoData = info;
  }

  function fetchDashboardData() {
    $('#loadingViewSpinner').show();
    $q.all([
      Container.query({all: 1}).$promise,
      Image.query({}).$promise,
      Volume.query({}).$promise,
      Network.query({}).$promise,
      Info.get({}).$promise,
    ]).then(function (d) {
      prepareContainerData(d[0]);
      prepareImageData(d[1]);
      prepareVolumeData(d[2]);
      prepareNetworkData(d[3]);
      prepareInfoData(d[4]);
      $('#loadingViewSpinner').hide();
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
    $scope.swarm = c.swarm;
    hiddenLabels = c.hiddenLabels;
    fetchDashboardData();
  });
}]);
