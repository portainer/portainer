angular
.module('portainer')
.directive('rdHeaderContent', function rdHeaderContent() {
  var directive = {
    requires: '^rdHeader',
    transclude: true,
    template: '<div class="breadcrumb-links" ng-transclude></div>',
    restrict: 'E'
  };
  return directive;
});
