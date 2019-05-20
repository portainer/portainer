angular.module('portainer.extensions.rbac')
  .directive('disableAuthorization', ['Authentication', 'ExtensionService', function(Authentication, ExtensionService) {
    return {
      restrict: 'A',
      link: async function (scope, elem, attrs) {

        const rbacEnabled = await ExtensionService.extensionEnabled(ExtensionService.EXTENSIONS.RBAC);
        if (!rbacEnabled) {
          elem.show();
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
    }
  }]);
