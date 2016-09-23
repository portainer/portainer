angular.module('dashboard')
.controller('MasterCtrl', ['$scope', '$cookieStore', 'Settings', 'Config', 'Info',
function ($scope, $cookieStore, Settings, Config, Info) {
  /**
  * Sidebar Toggle & Cookie Control
  */
  var mobileView = 992;

  $scope.getWidth = function() {
    return window.innerWidth;
  };

  $scope.swarm_mode = false;

  Config.$promise.then(function (c) {
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

  $scope.$watch($scope.getWidth, function(newValue, oldValue) {
    if (newValue >= mobileView) {
      if (angular.isDefined($cookieStore.get('toggle'))) {
        $scope.toggle = ! $cookieStore.get('toggle') ? false : true;
      } else {
        $scope.toggle = true;
      }
    } else {
      $scope.toggle = false;
    }

  });

  $scope.toggleSidebar = function() {
    $scope.toggle = !$scope.toggle;
    $cookieStore.put('toggle', $scope.toggle);
  };

  window.onresize = function() {
    $scope.$apply();
  };

  $scope.uiVersion = Settings.uiVersion;
}]);
