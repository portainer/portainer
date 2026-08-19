angular.module('portainer.app').directive('autoFocus', [
  '$timeout',
  function porAutoFocus($timeout) {
    var directive = {
      restrict: 'A',
      link: function (scope, element) {
        $timeout(function () {
          element[0].focus();
        });
      },
    };

    return directive;
  },
]);
