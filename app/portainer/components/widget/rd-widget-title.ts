export const rdWidgetTitle = {
  requires: '^rdWidget',
  bindings: {
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
        <span ng-class="$ctrl.classes" class="pull-left">
          <i class="fa" ng-class="$ctrl.icon"></i>
          <span ng-transclude="title">{{ $ctrl.titleText }}</span>
        </span>
        <span ng-class="$ctrl.classes" class="pull-right" ng-transclude></span>
      </div>
    </div>
`,
};
