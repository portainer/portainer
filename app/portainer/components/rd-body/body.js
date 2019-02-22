angular.module('portainer.app')
.directive('rdBody', ['$rootScope', '$timeout', function rdBody($rootScope, $timeout) {
  var directive = {
    scope: {
      'ngModel': '='
    },
    transclude: true,
    templateUrl: 'app/portainer/components/rd-body/body.template.html',
    restrict: 'EA',
    link: function(scope) {
      var removeLoadingScreen = function() {
        scope.viewLoading = false;
        scope.viewLoadingTimeoutPromise = null;
      };

      scope.viewLoading = true;
      scope.viewLoadingTimeoutPromise = $timeout(removeLoadingScreen, 1000);
      $rootScope.$on('cfpLoadingBar:started', function() {
        if (scope.viewLoadingTimeoutPromise) {
          $timeout.cancel(scope.viewLoadingTimeoutPromise);
          scope.viewLoadingTimeoutPromise = null;
        }
        scope.viewLoading = true;
      });

      $rootScope.$on('cfpLoadingBar:completed', function() {
        scope.viewLoadingTimeoutPromise = $timeout(removeLoadingScreen, 1000);
      });
    }
  };
  return directive;
}]);