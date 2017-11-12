angular.module('infra', [])
.controller('InfraController', ['$interval', '$q', '$scope', 'SystemService', 'NodeService', 'Pagination', 'Notifications', 'StateManager', 'Authentication',
function ($interval, $q, $scope, SystemService, NodeService, Pagination, Notifications, StateManager, Authentication) {
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('swarms');
  $scope.state.selectedItemCount = 0;
  $scope.sortType = 'Spec.Role';
  $scope.sortReverse = false;
  $scope.swarms = [];

  var statePromise;

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('swarms', $scope.state.pagination_count);
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredSwarms, function (swarm) {
      if (swarm.Checked !== allSelected) {
        swarm.Checked = allSelected;
        $scope.selectItem(swarm);
      }
    });
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  function initView() {
    $('#loadingViewSpinner').show();

    /*
    if (StateManager.getState().application.authentication) {
      var userDetails = Authentication.getUserDetails();
      var isAdmin = userDetails.role === 1 ? true: false;
      $scope.isAdmin = isAdmin;
    }

    var provider = $scope.applicationState.endpoint.mode.provider;
    $q.all({
      version: SystemService.version(),
      info: SystemService.info(),
      nodes: provider !== 'DOCKER_SWARM_MODE' || NodeService.nodes()
    })
    .then(function success(data) {
      $scope.docker = data.version;
      $scope.info = data.info;
      if (provider === 'DOCKER_SWARM_MODE') {
        var nodes = data.nodes;
        processTotalCPUAndMemory(nodes);
        $scope.nodes = nodes;
      } else {
        extractSwarmInfo(data.info);
      }

      $scope.stateAction()
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve cluster details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
      statePromise = $interval($scope.stateAction, 5000);
    });
    */

    $('#loadingViewSpinner').hide();
  }

  //$scope.$on('$destroy', function() {
  //    $interval.cancel(statePromise);
  //});

  initView();
}]);
