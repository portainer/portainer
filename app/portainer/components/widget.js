angular.module('portainer.app')
.directive('rdWidget', function rdWidget() {
  var directive = {
    scope: {
      'ngModel': '='
    },
    transclude: true,
    template: '<div class="widget" ng-transclude></div>',
    restrict: 'EA'
  };
  return directive;
});
