angular.module('secrets', [])
.controller('SecretsController', ['$scope', '$state', 'SecretService', 'Notifications', 'PaginationService',
function ($scope, $state, SecretService, Notifications, PaginationService) {
  $scope.state = {};
  $scope.state.selectedItemCount = 0;
  $scope.state.pagination_count = PaginationService.getPaginationCount('secrets');
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.order = function (sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredSecrets, function (secret) {
      if (secret.Checked !== allSelected) {
        secret.Checked = allSelected;
        $scope.selectItem(secret);
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
    angular.forEach($scope.secrets, function (secret) {
      if (secret.Checked) {
        SecretService.remove(secret.Id)
        .then(function success() {
          Notifications.success('Secret deleted', secret.Id);
          var index = $scope.secrets.indexOf(secret);
          $scope.secrets.splice(index, 1);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove secret');
        });
      }
    });
  };

  function initView() {
    SecretService.secrets()
    .then(function success(data) {
      $scope.secrets = data;
    })
    .catch(function error(err) {
      $scope.secrets = [];
      Notifications.error('Failure', err, 'Unable to retrieve secrets');
    });
  }

  initView();
}]);
