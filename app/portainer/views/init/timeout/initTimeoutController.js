angular.module('portainer.app').controller('InitTimeoutController', [
  '$scope',
  'StateManager',
  function ($scope, StateManager) {
    $scope.logo = StateManager.getState().application.logo;
  },
]);
