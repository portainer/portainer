angular.module('portainer.extensions.rbac').directive('authorization', ['Authentication', 'ExtensionService',
  function(Authentication, ExtensionService) {
    return {
      restrict: 'A',
      link: async function(scope, elem, attrs) {
        elem.hide();
        try {
          const rbacEnabled = await ExtensionService.extensionEnabled(ExtensionService.EXTENSIONS.RBAC);
          if (!rbacEnabled) {
            elem.show();
            return;
          } 
        } catch (err) {
          elem.show();
          return;
        }

        var authorizations = attrs.authorization.split(",");
        for (var i = 0; i < authorizations.length; i++) {
          authorizations[i] = authorizations[i].trim();
        }

        var hasAuthorizations = Authentication.hasAuthorizations(authorizations);

        if (hasAuthorizations) {
          elem.show();
        } else if (!hasAuthorizations && elem[0].tagName === 'A') {
          elem.show();
          elem.addClass('portainer-disabled-link');
        }
      }
    }
  }]);
