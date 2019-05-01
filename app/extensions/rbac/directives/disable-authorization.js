angular.module('portainer.extensions.rbac')
  .directive('disableAuthorization', ['Authentication', function(Authentication) {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {

        var authorizations = attrs.disableAuthorization.split(",");
        for (var i = 0; i < authorizations.length; i++) {
          authorizations[i] = authorizations[i].trim();
        }

        if (!Authentication.hasAuthorizations(authorizations)) {
          elem.attr('disabled', true);
        }
      }
    }
  }]);
