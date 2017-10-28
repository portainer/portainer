angular
.module('portainer')
.directive('rdHeaderTitle', ['Authentication', function rdHeaderTitle(Authentication) {
  var directive = {
    requires: '^rdHeader',
    scope: {
      title: '@'
    },
    link: function (scope, iElement, iAttrs) {
      scope.username = Authentication.getUserDetails().username;
    },
    transclude: true,
    template: '<div class="page white-space-normal"><span class="header_title_content" ng-transclude></span>{{title}}<span class="pull-right user-box" ng-if="username">{{username}} <i class="fa fa-user-circle-o" aria-hidden="true"></i><a title="User settings" ng-if="username" ui-sref="userSettings" style="padding-left: 5px;"><i class="fa fa-wrench" aria-hidden="true"></i></a><a title="Log out" ng-if="username" ui-sref="auth({logout: true})" class="text-danger" style="padding-left: 5px;"><i class="fa fa-sign-out" aria-hidden="true"></i></a></span></div>',
    restrict: 'E'
  };
  return directive;
}]);
