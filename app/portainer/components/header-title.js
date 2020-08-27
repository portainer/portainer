angular.module('portainer.app').directive('rdHeaderTitle', [
  'Authentication',
  function rdHeaderTitle(Authentication) {
    var directive = {
      requires: '^rdHeader',
      scope: {
        titleText: '@',
      },
      link: function (scope) {
        scope.username = Authentication.getUserDetails().username;
      },
      transclude: true,
      template:
        '<div class="page white-space-normal">{{titleText}}<span class="header_title_content" ng-transclude></span><span class="pull-right user-box" ng-if="username"><i class="fa fa-user-circle" aria-hidden="true"></i> {{username}}</span></div>',
      restrict: 'E',
    };
    return directive;
  },
]);
