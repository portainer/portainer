angular.module('portainer.app').directive('buttonSpinner', function buttonSpinner() {
  var directive = {
    restrict: 'A',
    scope: {
      spinning: '=buttonSpinner',
    },
    transclude: true,
    template: '<ng-transclude></ng-transclude><span ng-show="spinning"><i class="fa fa-circle-notch fa-spin" style="margin-left: 2px;"></i>&nbsp;</span>',
  };

  return directive;
});
