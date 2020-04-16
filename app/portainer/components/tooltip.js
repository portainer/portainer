angular.module('portainer.app')
.directive('portainerTooltip', [function portainerTooltip() {
  var directive = {
    scope: {
      message: '@',
      position: '@',
      customStyle: '<?'
    },
    template: `
    <span class="interactive" tooltip-append-to-body="true" tooltip-placement="{{position}}" tooltip-class="portainer-tooltip" uib-tooltip="{{message}}">
      <i class="" ng-class="['fa fa-question-circle blue-icon', {'tooltip-icon': !customStyle}]" ng-style="customStyle" aria-hidden="true"></i>
    </span>`,
    restrict: 'E'
  };
  return directive;
}]);
