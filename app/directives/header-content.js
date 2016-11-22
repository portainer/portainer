angular
.module('portainer')
.directive('rdHeaderContent', function rdHeaderContent() {
  var directive = {
    requires: '^rdHeader',
    transclude: true,
    template: '<div class="breadcrumb-links"><div class="pull-left" ng-transclude></div><div class="pull-right"><a ui-sref="auth({logout: true})" class="text-danger" style="margin-right: 25px;"><u>log out <i class="fa fa-sign-out" aria-hidden="true"></i></u></a></div></div>',
    restrict: 'E'
  };
  return directive;
});
