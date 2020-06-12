angular.module('portainer.app').directive('onEnterKey', [
  function porOnEnterKey() {
    var directive = {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.bind('keydown keypress', function (e) {
          if (e.which === 13) {
            e.preventDefault();
            scope.$apply(function () {
              scope.$eval(attrs.onEnterKey);
            });
          }
        });
      },
    };

    return directive;
  },
]);
