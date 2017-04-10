angular
.module('portainer')
.directive('rdHeaderContent', ['Authentication', function rdHeaderContent(Authentication) {
  var directive = {
    requires: '^rdHeader',
    transclude: true,
    link: function (scope, iElement, iAttrs) {
      scope.username = Authentication.getUserDetails().username;
    },
    template: '<div class="breadcrumb-links"><div class="pull-left" ng-transclude></div><div class="pull-right" ng-if="username"><a ui-sref="auth({logout: true})" class="text-danger" style="margin-right: 25px;"><u>log out <i class="fa fa-sign-out" aria-hidden="true"></i></u></a></div></div>',
    restrict: 'E'
  };
  return directive;
}]);
