angular
.module('portainer')
.directive('rdWidgetCustomHeader', function rdWidgetCustomHeader() {
  var directive = {
    requires: '^rdWidget',
    scope: {
      title: '=',
      icon: '='
    },
    transclude: true,
    template: '<div class="widget-header"><div class="row"><span class="pull-left"><img class="custom-header-ico" ng-src="{{icon}}"></img> <span class="small text-muted"> {{title}} </span> </span><span class="pull-right col-xs-6 col-sm-4" ng-transclude></span></div></div>',
    restrict: 'E'
  };
  return directive;
});
