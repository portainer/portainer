angular.module('portainer.app')
  .directive('authorization', ['Authentication', function(Authentication) {
    return {
      restrict: 'A',
      link: function (scope, elem, attrs) {

        elem.hide();

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
