angular
.module('portainer')
.directive('rdHeaderTitle', function rdHeaderTitle() {
  var directive = {
    requires: '^rdHeader',
    scope: {
      title: '@',
      username: '@'
    },
    transclude: true,
    template: '<div class="page white-space-normal">{{title}}<span class="header_title_content" ng-transclude></span><span class="pull-right user-box"><i class="fa fa-user-circle-o" aria-hidden="true"></i> {{username}}</span></div>',
    restrict: 'E'
  };
  return directive;
});
