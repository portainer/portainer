angular.module('portainer.app').directive('buttonSpinner', function buttonSpinner() {
  var directive = {
    restrict: 'A',
    scope: {
      spinning: '=buttonSpinner',
    },
    transclude: true,
    template: '<ng-transclude></ng-transclude><span ng-show="spinning"><pr-icon icon="\'svg-circlenotch\'" class-name="\'animate-spin-slow ml-0.5\'"></pr-icon>&nbsp;</span>',
  };

  return directive;
});
