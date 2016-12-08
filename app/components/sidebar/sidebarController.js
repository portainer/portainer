angular.module('sidebar', [])
.controller('SidebarController', ['$scope', 'Settings', 'Config', 'Info',
function ($scope, Settings, Config, Info) {

  $scope.swarm_mode = false;

  Config.$promise.then(function (c) {
    $scope.logo = c.logo;
    $scope.swarm = c.swarm;
      Info.get({}, function(d) {
        if ($scope.swarm && !_.startsWith(d.ServerVersion, 'swarm')) {
          $scope.swarm_mode = true;
          $scope.swarm_manager = false;
          if (d.Swarm.ControlAvailable) {
            $scope.swarm_manager = true;
          }
        }
      });
  });

  $scope.uiVersion = Settings.uiVersion;
}]);
