angular
.module('portainer')
.directive('rdLoading', function rdLoading() {
  var directive = {
    restrict: 'AE',
    template: '<div class="loading"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>'
  };
  return directive;
});
