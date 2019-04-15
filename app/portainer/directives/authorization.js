angular.module('portainer.app')
  .directive('authorization', ['Authentication', function(Authentication) {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {

        elem.hide();

        var requiredAuthorization = attrs.authorization;

        if (Authentication.hasAuthorizations(requiredAuthorization)) {
          elem.show();
        }
      }
    }
  }]);