export const rdWidgetTitle = {
  requires: '^rdWidget',
  bindings: {
    titleText: '@',
    icon: '@',
    featherIcon: '<',
    classes: '@?',
    parentClasses: '@?',
  },
  transclude: {
    title: '?headerTitle',
  },
  template: `
    <div class="widget-header" ng-class="$ctrl.parentClasses">
      <div class="row">
        <span ng-class="$ctrl.classes" class="pull-left vertical-center">
        <pr-icon icon="$ctrl.icon" class-name="'icon-nested-blue space-right'" mode="'primary'" feather="$ctrl.featherIcon"></pr-icon>
        <span ng-transclude="title">{{ $ctrl.titleText }}</span>
        </span>
        <span ng-class="$ctrl.classes" class="pull-right" ng-transclude></span>
      </div>
    </div>
`,
};
