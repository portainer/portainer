angular.module('portainer.app').directive('rdTemplateWidget', function rdWidget() {
  var directive = {
    scope: {
      ngModel: '=',
    },
    transclude: true,
    template: '<div class="widget template-widget" id="template-widget" ng-transclude></div>',
    restrict: 'EA',
  };
  return directive;
});
