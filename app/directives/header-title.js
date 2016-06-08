angular
.module('uifordocker')
.directive('rdHeaderTitle', function rdHeaderTitle() {
  var directive = {
    requires: '^rdHeader',
    scope: {
      title: '@',
    },
    transclude: true,
    template: '<div class="page">{{title}}</div>',
    restrict: 'E'
  };
  return directive;
});
