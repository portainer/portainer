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
    template: '<div class="page white-space-normal">{{title}}<span class="header_title_content" ng-transclude></span><span class="pull-right user-box" ng-if="username"><i class="fa fa-user-circle-o" aria-hidden="true"></i> {{username}}</span><a ui-sref="settings_about" class="pull-right" style="font-size:14px;padding-right:10px;padding-top:2px;"><span class="fa fa-heart fa-fw" style="color:#c9302c;"></span>  Help support portainer</a></div>',
    restrict: 'E'
  };
  return directive;
}]);
