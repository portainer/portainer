angular.module('extension.storidge')
.controller('StoridgeMonitorController', ['$q', '$scope', '$interval', '$document', 'Notifications', 'Pagination', 'StoridgeClusterService', 'StoridgeChartService', 'ModalService',
function ($q, $scope, $interval, $document, Notifications, Pagination, StoridgeClusterService, StoridgeChartService, ModalService) {

  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('storidge_events');
  $scope.sortType = 'Time';
  $scope.sortReverse = true;

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('storidge_events', $scope.state.pagination_count);
  };

  $scope.$on('$destroy', function() {
    stopRepeater();
  });

  function stopRepeater() {
    var repeater = $scope.repeater;
    if (angular.isDefined(repeater)) {
      $interval.cancel(repeater);
      repeater = null;
    }
  }

  function updateIOPSChart(info, chart) {
    var usedIOPS = info.UsedIOPS;
    var label = moment(new Date()).format('HH:mm:ss');

    StoridgeChartService.UpdateChart(label, usedIOPS, chart);
  }

  function updateBandwithChart(info, chart) {
    var usedBandwidth = info.UsedBandwidth;
    var label = moment(new Date()).format('HH:mm:ss');

    StoridgeChartService.UpdateChart(label, usedBandwidth, chart);
  }

  function updateCapacityChart(info, chart) {
    var usedCapacity = info.UsedCapacity;
    var freeCapacity = info.FreeCapacity;

    StoridgeChartService.UpdateChart('Free', freeCapacity, chart);
    StoridgeChartService.UpdateChart('Used', usedCapacity, chart);
  }

  function setUpdateRepeater(iopsChart, bandwidthChart) {
    var refreshRate = 5000;
    $scope.repeater = $interval(function() {
      $q.all({
        events: StoridgeClusterService.events(),
        info: StoridgeClusterService.info()
      })
      .then(function success(data) {
        $scope.events = data.events;
        var info = data.info;
        $scope.info = info;
        updateIOPSChart(info, iopsChart);
        updateBandwithChart(info, bandwidthChart);
      })
      .catch(function error(err) {
        stopRepeater();
        Notifications.error('Failure', err, 'Unable to retrieve cluster information');
      });
    }, refreshRate);
  }

  function startViewUpdate(iopsChart, bandwidthChart, capacityChart) {
    $('#loadingViewSpinner').show();
    $q.all({
      events: StoridgeClusterService.events(),
      info: StoridgeClusterService.info()
    })
    .then(function success(data) {
      $scope.events = data.events;
      var info = data.info;
      $scope.info = info;
      updateIOPSChart(info, iopsChart);
      updateBandwithChart(info, bandwidthChart);
      updateCapacityChart(info, capacityChart);
      setUpdateRepeater(iopsChart, bandwidthChart);
    })
    .catch(function error(err) {
      stopRepeater();
      Notifications.error('Failure', err, 'Unable to retrieve cluster information');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  function initCharts() {
    var iopsChartCtx = $('#iopsChart');
    var iopsChart = StoridgeChartService.CreateIOPSChart(iopsChartCtx);

    var bandwidthChartCtx = $('#bandwithChart');
    var bandwidthChart = StoridgeChartService.CreateBandwidthChart(bandwidthChartCtx);

    var capacityChartCtx = $('#capacityChart');
    var capacityChart = StoridgeChartService.CreateCapacityChart(capacityChartCtx);

    startViewUpdate(iopsChart, bandwidthChart, capacityChart);
  }

  function initView() {
    $('#loadingViewSpinner').show();

    $document.ready(function() {
      initCharts();
    });
  }

  initView();
}]);
