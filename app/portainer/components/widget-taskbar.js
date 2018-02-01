angular.module('portainer.app')
.directive('rdWidgetTaskbar', function rdWidgetTaskbar() {
  var directive = {
    requires: '^rdWidget',
    scope: {
      classes: '@?'
    },
    transclude: true,
    template: '<div class="widget-header"><div class="row"><div ng-class="classes" ng-transclude></div></div></div>',
    restrict: 'E'
  };
  return directive;
});
