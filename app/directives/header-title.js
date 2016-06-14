angular
.module('uifordocker')
.directive('rdHeaderTitle', function rdHeaderTitle() {
  var directive = {
    requires: '^rdHeader',
    scope: {
      title: '@'
    },
    transclude: true,
    template: '<div class="page">{{title}}<span class="header_title_content" ng-transclude><span></div>',
    restrict: 'E'
  };
  return directive;
});
