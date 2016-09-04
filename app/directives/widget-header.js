angular
.module('portainer')
.directive('rdWidgetHeader', function rdWidgetTitle() {
  var directive = {
    requires: '^rdWidget',
    scope: {
      title: '@',
      icon: '@'
    },
    transclude: true,
    template: '<div class="widget-header"><div class="row"><span class="pull-left"><i class="fa" ng-class="icon"></i> {{title}} </span><span class="pull-right col-xs-6 col-sm-4" ng-transclude></span></div></div>',
    restrict: 'E'
  };
  return directive;
});
