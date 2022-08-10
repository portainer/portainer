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
          <div class="widget-icon space-right">
            <pr-icon icon="$ctrl.icon" feather="$ctrl.featherIcon"></pr-icon>
          </div>
          <span ng-transclude="title">{{ $ctrl.titleText }}</span>
        </span>
        <span ng-class="$ctrl.classes" class="pull-right" ng-transclude></span>
      </div>
    </div>
`,
};
