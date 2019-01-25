angular.module('portainer.extensions.oauth')
.controller('OAuthSettingsController', function OAuthSettingsController() {
  this.onSelectProvider = onSelectProvider;

  function onSelectProvider(provider) {
    this.settings.AuthorizationURI = provider.authUrl;
    this.settings.AccessTokenURI = provider.accessTokenUrl;
    this.settings.ResourceURI = provider.resourceUrl;
    this.settings.UserIdentifier = provider.userIdentifier;
  }
});
