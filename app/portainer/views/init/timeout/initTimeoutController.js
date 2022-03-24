import angular from 'angular';

angular.module('portainer.app').controller('InitTimeoutController', InitTimeoutController);

/* @ngInject */
function InitTimeoutController($scope, StateManager) {
  $scope.logo = StateManager.getState().application.logo;
}
