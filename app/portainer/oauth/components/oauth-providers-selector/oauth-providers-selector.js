angular.module('portainer.oauth').component('oauthProvidersSelector', {
  templateUrl: './oauth-providers-selector.html',
  bindings: {
    onSelect: '<',
    provider: '=',
  },
  controller: 'OAuthProviderSelectorController',
});
