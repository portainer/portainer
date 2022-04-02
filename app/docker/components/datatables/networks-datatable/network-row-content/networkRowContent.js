import { ResourceControlOwnership as RCO } from '@/portainer/access-control/types';

angular.module('portainer.docker').directive('networkRowContent', [
  function networkRowContent() {
    var directive = {
      templateUrl: './networkRowContent.html',
      restrict: 'A',
      transclude: true,
      scope: {
        item: '<',
        parentCtrl: '<',
        allowCheckbox: '<',
        allowExpand: '<',
      },
      controller: ($scope) => {
        $scope.RCO = RCO;
      },
    };
    return directive;
  },
]);
