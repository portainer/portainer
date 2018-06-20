angular.module('portainer.app')
.directive('portainerTooltip', [function portainerTooltip() {
  var directive = {
    scope: {
      message: '@',
      position: '@'
    },
    template: '<span class="interactive" tooltip-append-to-body="true" tooltip-placement="{{position}}" tooltip-class="portainer-tooltip" uib-tooltip="{{message}}"><i class="fa fa-question-circle tooltip-icon" aria-hidden="true"></i></span>',
    restrict: 'E'
  };
  return directive;
}]);
