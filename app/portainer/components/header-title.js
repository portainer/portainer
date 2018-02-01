angular.module('portainer.app')
.directive('rdHeaderTitle', ['Authentication', 'StateManager', function rdHeaderTitle(Authentication, StateManager) {
  var directive = {
    requires: '^rdHeader',
    scope: {
      title: '@'
    },
    link: function (scope, iElement, iAttrs) {
      scope.username = Authentication.getUserDetails().username;
      scope.displayDonationHeader = StateManager.getState().application.displayDonationHeader;
    },
    transclude: true,
    template: '<div class="page white-space-normal">{{title}}<span class="header_title_content" ng-transclude></span><span class="pull-right user-box" ng-if="username"><i class="fa fa-user-circle-o" aria-hidden="true"></i> {{username}}</span><a ng-if="displayDonationHeader" ui-sref="portainer.about" class="pull-right" style="font-size:14px;margin-right:15px;margin-top:2px;"><span class="fa fa-heart fa-fw red-icon"></span>  Help support portainer</a></div>',
    restrict: 'E'
  };
  return directive;
}]);
