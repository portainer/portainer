angular.module('portainer.extensions.oauth').component('oauthProvidersSelector', {
  templateUrl: 'app/extensions/oauth/components/oauth-providers-selector/oauth-providers-selector.html',
  bindings: {
    onSelect: '<',
    provider: '='
  },
  controller: 'OAuthProviderSelectorController'
});
