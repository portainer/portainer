angular.module('portainer.app').directive('rdWidgetHeader', function rdWidgetTitle() {
  var directive = {
    requires: '^rdWidget',
    scope: {
      titleText: '@',
      icon: '@',
      classes: '@?',
    },
    transclude: {
      title: '?headerTitle',
    },
    template: `
    <div class="widget-header">
      <div class="row">
        <span ng-class="classes" class="pull-left">
          <i class="fa" ng-class="icon"></i>
          <span ng-transclude="title">{{ titleText }}</span>
        </span>
        <span ng-class="classes" class="pull-right" ng-transclude></span>
      </div>
    </div>
`,
    restrict: 'E',
  };
  return directive;
});
