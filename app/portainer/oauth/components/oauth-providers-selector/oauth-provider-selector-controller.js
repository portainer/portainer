angular.module('portainer.oauth').controller('OAuthProviderSelectorController', function OAuthProviderSelectorController() {
  var ctrl = this;

  this.providers = [
    {
      authUrl: '',
      accessTokenUrl: '',
      resourceUrl: '',
      userIdentifier: '',
      scopes: '',
      name: 'custom',
      label: 'Custom',
      description: 'Custom OAuth provider',
      icon: 'fa fa-user-check',
    },
  ];

  this.$onInit = onInit;

  function onInit() {
    if (ctrl.provider.authUrl) {
      ctrl.provider = getProviderByURL(ctrl.provider.authUrl);
    } else {
      ctrl.provider = ctrl.providers[0];
    }
    ctrl.onSelect(ctrl.provider, false);
  }

  function getProviderByURL(providerAuthURL) {
    if (providerAuthURL.indexOf('login.microsoftonline.com') !== -1) {
      return ctrl.providers[0];
    } else if (providerAuthURL.indexOf('accounts.google.com') !== -1) {
      return ctrl.providers[1];
    } else if (providerAuthURL.indexOf('github.com') !== -1) {
      return ctrl.providers[2];
    }
    return ctrl.providers[3];
  }
});
