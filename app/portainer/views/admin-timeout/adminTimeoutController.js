import angular from 'angular';

angular.module('portainer.app').controller('AdminTimeoutController', AdminTimeoutController);

/* @ngInject */
export default function AdminTimeoutController($scope, StateManager) {
  $scope.logo = StateManager.getState().application.logo;
}
