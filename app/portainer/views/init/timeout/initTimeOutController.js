angular.module('portainer.app').controller('InitTimeOutController', [
  '$scope',
  'StateManager',
  function ($scope, StateManager) {
    $scope.logo = StateManager.getState().application.logo;
  },
]);
