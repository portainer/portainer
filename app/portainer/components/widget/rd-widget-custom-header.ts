export const rdWidgetCustomHeader = {
  requires: '^rdWidget',
  bindings: {
    titleText: '=',
    icon: '=',
  },
  transclude: true,
  template: `
    <div class="widget-header">
      <div class="row">
        <span class="pull-left">
          <img class="custom-header-ico space-right" ng-src="{{$ctrl.icon}}" ng-if="$ctrl.icon" alt="header-icon"></img>
          <i class="fa fa-rocket" aria-hidden="true" ng-if="!$ctrl.icon"></i>
          <span class="text-muted"> {{$ctrl.titleText}} </span>
        </span>
        <span class="pull-right col-xs-6 col-sm-4" ng-transclude></span>
      </div>
    </div>
  `,
};

// a react component wasn't created because WidgetTitle were adjusted to support a custom image
