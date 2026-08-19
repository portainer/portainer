angular.module('portainer.app').controller('MainController', MainController);

/* @ngInject */
function MainController($scope, StateManager, ThemeManager, SidebarService) {
  /**
   * Sidebar Toggle & Cookie Control
   */

  $scope.applicationState = StateManager.getState();

  $scope.isSidebarOpen = SidebarService.isSidebarOpen;

  ThemeManager.autoTheme();
}
