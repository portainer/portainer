angular.module('portainer.extensions.oauth').component('oauthProvidersSelector', {
  templateUrl: 'app/extensions/oauth/components/oauth-providers-selector/oauth-providers-selector.html',
  bindings: {
    onSelect: '<'
  },
  controller: function oauthProvidersSelectorController() {
    this.providers = [
      {
        name: 'Facebook',
        authUrl: 'https://www.facebook.com/v3.2/dialog/oauth',
        accessTokenUrl: 'https://graph.facebook.com/v3.2/oauth/access_token',
        resourceUrl: 'https://graph.facebook.com/v3.2/me?fields=email',
        userIdentifier: 'email'
      },
      {
        name: 'Custom'
      }
    ];
  }
});
