export const rdWidgetBody = {
  requires: '^rdWidget',
  bindings: {
    loading: '@?',
    classes: '@?',
  },
  transclude: true,
  template: `
    <div class="widget-body" ng-class="$ctrl.classes">
      <rd-loading ng-show="$ctrl.loading"></rd-loading>
      <div ng-hide="$ctrl.loading" class="widget-content" ng-transclude></div>
    </div>
  `,
};
