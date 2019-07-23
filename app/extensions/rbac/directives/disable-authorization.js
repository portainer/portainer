angular.module('portainer.extensions.rbac')
  .directive('disableAuthorization', ['Authentication', 'ExtensionService', '$async', function(Authentication, ExtensionService, $async) {

    async function linkAsync(scope, elem, attrs) {
      try {
        const rbacEnabled = await ExtensionService.extensionEnabled(ExtensionService.EXTENSIONS.RBAC);
        if (!rbacEnabled) {
          return;
        }
      } catch (err) {
        return;
      }

      var authorizations = attrs.disableAuthorization.split(",");
      for (var i = 0; i < authorizations.length; i++) {
        authorizations[i] = authorizations[i].trim();
      }

      if (!Authentication.hasAuthorizations(authorizations)) {
        elem.attr('disabled', true);
      }
    }

    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {
        return $async(linkAsync, scope, elem, attrs);
      }
    }
  }]);
