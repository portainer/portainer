angular.module('portainer.rbac').directive('disableAuthorization', [
  'Authentication',
  '$async',
  function (Authentication, $async) {
    async function linkAsync(scope, elem, attrs) {
      var authorizations = attrs.disableAuthorization.split(',');
      for (var i = 0; i < authorizations.length; i++) {
        authorizations[i] = authorizations[i].trim();
      }

      if (!Authentication.hasAuthorizations(authorizations)) {
        elem.attr('disabled', true);
        if (elem.is('Slider')) {
          elem.css('pointer-events', 'none');
        }
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
