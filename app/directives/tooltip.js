angular
.module('portainer')
.directive('portainerTooltip', [function portainerTooltip() {
  var directive = {
    scope: {
      message: '@',
      position: '@'
    },
    template: '<span class="interactive" tooltip-placement="{{position}}" tooltip-class="portainer-tooltip" uib-tooltip="{{message}}"><i class="fa fa-question-circle tooltip-icon" aria-hidden="true"></i></span>',
    restrict: 'E'
  };
  return directive;
}]);
