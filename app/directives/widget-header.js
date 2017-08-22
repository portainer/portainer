angular
.module('portainer')
.directive('rdWidgetHeader', function rdWidgetTitle() {
  var directive = {
    requires: '^rdWidget',
    scope: {
      title: '@',
      icon: '@',
      classes: '@?'
    },
    transclude: true,
    template: '<div class="widget-header"><div class="row"><span ng-class="classes" class="pull-left" translate><i class="fa" ng-class="icon"></i> {{title}} </span><span ng-class="classes" class="pull-right" ng-transclude></span></div></div>',
    restrict: 'E'
  };
  return directive;
});
