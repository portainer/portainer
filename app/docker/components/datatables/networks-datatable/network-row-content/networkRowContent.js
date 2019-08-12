angular.module('portainer.docker')
.directive('networkRowContent', [function networkRowContent() {
  var directive = {
    templateUrl: './networkRowContent.html',
    restrict: 'A',
    transclude: true,
    scope: {
      item: '<',
      parentCtrl: '<',
      allowCheckbox: '<',
      allowExpand: '<'
    }
  };
  return directive;
}]);
