angular
.module('portainer')
.directive('rdHeader', function rdHeader() {
  var directive = {
    scope: {
      "ngModel": "="
    },
    transclude: true,
    template: '<div class="row header"><div class="col-xs-12"><div class="meta" ng-transclude></div></div></div>',
    restrict: 'EA'
  };
  return directive;
});
