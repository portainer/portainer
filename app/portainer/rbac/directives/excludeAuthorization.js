angular.module('portainer.rbac').directive('excludeAuthorization', [
  'Authentication',
  '$async',
  function (Authentication, $async) {
    async function linkAsync(scope, elem, attrs) {
      elem.show();

      var authorizations = attrs.excludeAuthorization.split(',');
      for (var i = 0; i < authorizations.length; i++) {
        authorizations[i] = authorizations[i].trim();
      }

      var hasAuthorizations = Authentication.hasAuthorizations(authorizations);

      if (hasAuthorizations) {
        elem.hide();
      }
    }

    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
        return $async(linkAsync, scope, elem, attrs);
      },
    };
  },
]);
