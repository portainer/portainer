export const rdWidgetTitle = {
  requires: '^rdWidget',
  bindings: {
    titleText: '@',
    icon: '@',
    featherIcon: '<',
    classes: '@?',
  },
  transclude: {
    title: '?headerTitle',
  },
  template: `
    <div class="widget-header">
      <div class="row">
        <span ng-class="$ctrl.classes" class="pull-left vertical-center">
          <pr-icon icon="$ctrl.icon" feather="$ctrl.featherIcon" class-name="'icon-primary icon-nested-blue'"></pr-icon>
          <span ng-transclude="title">{{ $ctrl.titleText }}</span>
        </span>
        <span ng-class="$ctrl.classes" class="pull-right" ng-transclude></span>
      </div>
    </div>
`,
};
