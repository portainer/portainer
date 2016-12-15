angular.module('sidebar', [])
.controller('SidebarController', ['$scope', 'Settings', 'Config', 'Info',
function ($scope, Settings, Config, Info) {

  Config.$promise.then(function (c) {
    $scope.logo = c.logo;
  });

  $scope.uiVersion = Settings.uiVersion;
}]);
