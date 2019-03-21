angular.module('portainer.extensions.oauth')
  .controller('OAuthProviderSelectorController', function OAuthProviderSelectorController() {
    var ctrl = this;

    this.providers = [
      {
        authUrl: 'https://login.microsoftonline.com/TENANT_ID/oauth2/authorize',
        accessTokenUrl: 'https://login.microsoftonline.com/TENANT_ID/oauth2/token',
        resourceUrl: 'https://graph.windows.net/TENANT_ID/me?api-version=2013-11-08',
        userIdentifier: 'userPrincipalName',
        scopes: 'id,email,name',
        name: 'microsoft'
      },
      {
        authUrl: 'https://accounts.google.com/o/oauth2/auth',
        accessTokenUrl: 'https://accounts.google.com/o/oauth2/token',
        resourceUrl: 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json',
        userIdentifier: 'email',
        scopes: 'profile email',
        name: 'google'
      },
      {
        authUrl: 'https://github.com/login/oauth/authorize',
        accessTokenUrl: 'https://github.com/login/oauth/access_token',
        resourceUrl: 'https://api.github.com/user',
        userIdentifier: 'login',
        scopes: 'id email name',
        name: 'github'
      },
      {
        authUrl: '',
        accessTokenUrl: '',
        resourceUrl: '',
        userIdentifier: '',
        scopes: '',
        name: 'custom'
      }
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
      }
      else if (providerAuthURL.indexOf('accounts.google.com') !== -1) {
        return ctrl.providers[1];
      }
      else if (providerAuthURL.indexOf('github.com') !== -1) {
        return ctrl.providers[2];
      }
      return ctrl.providers[3];
    }
  });
