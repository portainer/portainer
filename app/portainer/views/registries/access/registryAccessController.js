angular.module('portainer.app')
.controller('RegistryAccessController', ['$scope', '$state', '$transition$', 'RegistryService', 'Notifications',
function ($scope, $state, $transition$, RegistryService, Notifications) {

  $scope.updateAccess = function() {
    $scope.state.actionInProgress = true;
    RegistryService.updateRegistry($scope.registry)
    .then(() => {
      Notifications.success("Access successfully updated");
      $state.reload();
    })
    .catch((err) => {
      $scope.state.actionInProgress = false;
      Notifications.error("Failure", err, "Unable to update accesses");
    });
  };

  function initView() {
    $scope.state = {actionInProgress: false};
    RegistryService.registry($transition$.params().id)
    .then(function success(data) {
      $scope.registry = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    });
  }

  initView();
}]);
