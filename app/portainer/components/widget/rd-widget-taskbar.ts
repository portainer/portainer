export const rdWidgetTaskbar = {
  requires: '^rdWidget',
  bindings: {
    classes: '@?',
  },
  transclude: true,
  template: `
    <div class="widget-header">
      <div class="row">
        <div ng-class="$ctrl.classes" ng-transclude></div>
      </div>
    </div>
  `,
};
