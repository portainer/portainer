angular
.module('portainer')
.directive('rdHeaderContent', ['Authentication', function rdHeaderContent(Authentication) {
  var directive = {
    requires: '^rdHeader',
    transclude: true,
    link: function (scope, iElement, iAttrs) {
      scope.username = Authentication.getUserDetails().username;
    },
    template: '<div class="breadcrumb-links"><div class="pull-left" ng-transclude></div></div>',
    restrict: 'E'
  };
  return directive;
}]);
