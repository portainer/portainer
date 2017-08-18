angular
.module('portainer')
.directive('rdHeaderContent', ['Authentication', function rdHeaderContent(Authentication) {
  var directive = {
    requires: '^rdHeader',
    transclude: true,
    link: function (scope, iElement, iAttrs) {
      scope.username = Authentication.getUserDetails().username;
    },
    template: '<div class="breadcrumb-links"><div class="pull-left" ng-transclude></div><div class="pull-right" ng-if="username"><a ui-sref="userSettings" style="margin-right: 5px;"><u><i class="fa fa-wrench" aria-hidden="true"></i> <por-translation key="WIDGETS.HEADER_CONTENT.USER_PREFERENCES"></por-translation></u></a><a ui-sref="auth({logout: true})" class="text-danger" style="margin-right: 25px;"><u><i class="fa fa-sign-out" aria-hidden="true"></i>  <por-translation key="WIDGETS.HEADER_CONTENT.LOGOUT"></por-translation></u></a></div></div>',
    restrict: 'E'
  };
  return directive;
}]);
