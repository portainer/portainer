angular
.module('portainer')
.directive('rdHeader', ['$window', 'Authentication', function rdHeader($window, Authentication) {
  var directive = {
    scope: {
      'ngModel': '='
    },
    link: function (scope, iElement, iAttrs) {
      scope.username = Authentication.getUserDetails().username;
      $window.document.title = 'Portainer | '+iAttrs.title;
    },
    transclude: true,
    template: '<div class="row header"><div class="meta col-xs-12"><div class="page white-space-normal"><span class="header_title_content" ng-transclude></span><span class="pull-right user-box" ng-if="username">{{username}} <i class="fa fa-user-circle-o" aria-hidden="true"></i><a title="User settings" ng-if="username" ui-sref="userSettings" style="padding-left: 6px;"><i class="fa fa-wrench" aria-hidden="true"></i></a><a title="Log out" ng-if="username" ui-sref="auth({logout: true})" class="text-danger" style="padding-left: 6px;"><i class="fa fa-sign-out" aria-hidden="true"></i></a></span></div></div></div>',
    restrict: 'E'
  };
  return directive;
}]);
