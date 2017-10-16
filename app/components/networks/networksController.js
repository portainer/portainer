angular.module('networks', [])
.controller('NetworksController', ['$scope', '$state', 'Network', 'NetworkService', 'Notifications', 'PaginationService',
function ($scope, $state, Network, NetworkService, Notifications, PaginationService) {
  $scope.state = {};
  $scope.state.pagination_count = PaginationService.getPaginationCount('networks');
  $scope.state.selectedItemCount = 0;
  $scope.state.advancedSettings = false;
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.changePaginationCount = function() {
    PaginationService.setPaginationCount('networks', $scope.state.pagination_count);
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.selectItems = function(allSelected) {
    angular.forEach($scope.state.filteredNetworks, function (network) {
      if (network.Checked !== allSelected) {
          network.Checked = allSelected;
          $scope.selectItem(network);
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

  $scope.removeAction = function () {
    $('#loadNetworksSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadNetworksSpinner').hide();
      }
    };
    angular.forEach($scope.networks, function (network) {
      if (network.Checked) {
        counter = counter + 1;
        Network.remove({id: network.Id}, function (d) {
          if (d.message) {
            Notifications.error('Error', d, 'Unable to remove network');
          } else {
            Notifications.success('Network removed', network.Id);
            var index = $scope.networks.indexOf(network);
            $scope.networks.splice(index, 1);
          }
          complete();
        }, function (e) {
          Notifications.error('Failure', e, 'Unable to remove network');
          complete();
        });
      }
    });
  };

  function initView() {
    $('#loadNetworksSpinner').show();

    NetworkService.networks(true, true, true, true)
    .then(function success(data) {
      $scope.networks = data;
    })
    .catch(function error(err) {
      $scope.networks = [];
      Notifications.error('Failure', err, 'Unable to retrieve networks');
    })
    .finally(function final() {
      $('#loadNetworksSpinner').hide();
    });
  }

  initView();
}]);
