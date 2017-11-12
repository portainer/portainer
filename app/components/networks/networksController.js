angular.module('networks', [])
.controller('NetworksController', ['$scope', '$state', 'Network', 'NetworkService', 'Notifications', 'PaginationService',
function ($scope, $state, Network, NetworkService, Notifications, PaginationService) {
  // $scope.state = {};
  // $scope.state.pagination_count = PaginationService.getPaginationCount('networks');
  // $scope.state.selectedItemCount = 0;
  // $scope.sortType = 'Name';
  // $scope.sortReverse = false;

  // $scope.changePaginationCount = function() {
  //   PaginationService.setPaginationCount('networks', $scope.state.pagination_count);
  // };

  // $scope.order = function(sortType) {
  //   $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
  //   $scope.sortType = sortType;
  // };
  //
  // $scope.selectItems = function(allSelected) {
  //   angular.forEach($scope.state.filteredNetworks, function (network) {
  //     if (network.Checked !== allSelected) {
  //         network.Checked = allSelected;
  //         $scope.selectItem(network);
  //     }
  //   });
  // };
  //
  // $scope.selectItem = function (item) {
  //   if (item.Checked) {
  //     $scope.state.selectedItemCount++;
  //   } else {
  //     $scope.state.selectedItemCount--;
  //   }
  // };

  $scope.renderFieldOwnership = function(item, value) {
    switch (item.ResourceControl.Ownership) {
      case 'private':
        return '<span><i class="fa fa-eye-slash" aria-hidden="true" style="margin-right: 5px"></i>private</span>';
      case 'administrators':
        return '<span><i class="fa fa-eye-slash" aria-hidden="true" style="margin-right: 5px"></i>administrators</span>';
      case 'restricted':
        return '<span><i class="fa fa-users" aria-hidden="true" style="margin-right: 5px"></i>restricted</span>';
      default:
        return '<span><i class="fa fa-eye" aria-hidden="true" style="margin-right: 5px"></i>public</span>';
    }
  };

  $scope.goToNetworkCreation = function() {
    $state.go('actions.create.network');
  };

  $scope.removeAction = function () {
    angular.forEach($scope.networks, function (network) {
      if (network.Checked) {
        Network.remove({id: network.Id}, function (d) {
          if (d.message) {
            Notifications.error('Error', d, 'Unable to remove network');
          } else {
            Notifications.success('Network removed', network.Id);
            var index = $scope.networks.indexOf(network);
            $scope.networks.splice(index, 1);
          }
        }, function (e) {
          Notifications.error('Failure', e, 'Unable to remove network');
        });
      }
    });
  };

  function initView() {
    NetworkService.networks(true, true, true, true)
    .then(function success(data) {
      $scope.networks = data;
    })
    .catch(function error(err) {
      $scope.networks = [];
      Notifications.error('Failure', err, 'Unable to retrieve networks');
    });
  }

  initView();
}]);
