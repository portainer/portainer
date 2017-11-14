angular.module('infra', [])
.controller('InfraController', ['$interval', '$q', '$scope', 'EndpointService', 'InfraService', 'SystemService', 'NodeService', 'Pagination', 'Notifications', 'StateManager', 'Authentication',
function ($interval, $q, $scope, EndpointService, InfraService, SystemService, NodeService, Pagination, Notifications, StateManager, Authentication) {
  $scope.state = {};
  $scope.state.pagination_count = Pagination.getPaginationCount('swarms');
  $scope.state.selectedItemCount = 0;
  $scope.sortType = 'Spec.Role';
  $scope.sortReverse = false;
  //$scope.swarms = [];

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
    $scope.spinner = true;
    $scope.applicationState.infra = true;

    // TODO: add re-discover or refresh option later
    var tmpSwarms = InfraService.getSwarms();
    if (tmpSwarms.length == 0) {
        EndpointService.endpoints()
        .then(function success(data) {
          $scope.endpoints = data;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve endpoints');
          $scope.endpoints = [];
        })
        .finally(function final() {
          InfraService.getEndpointStates($scope.endpoints)
          .then(function success(data) {
            $scope.swarms = data;
            InfraService.setSwarms(data);
          });
        });
    } else {
        $scope.swarms = tmpSwarms;
    }

    $scope.spinner = false;
  }

  initView();
}]);
