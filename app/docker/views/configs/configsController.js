angular.module('portainer.docker')
.controller('ConfigsController', ['$scope', '$state', 'ConfigService', 'Notifications',
function ($scope, $state, ConfigService, Notifications) {

  $scope.removeAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (config) {
      ConfigService.remove(config.Id)
      .then(function success() {
        Notifications.success('Config successfully removed', config.Name);
        var index = $scope.configs.indexOf(config);
        $scope.configs.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove config');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  function initView() {
    ConfigService.configs()
    .then(function success(data) {
      $scope.configs = data;
    })
    .catch(function error(err) {
      $scope.configs = [];
      Notifications.error('Failure', err, 'Unable to retrieve configs');
    });
  }

  initView();
}]);
