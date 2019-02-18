angular.module('portainer.extensions.oauth')
  .controller('OAuthSettingsController', function OAuthSettingsController() {
    var ctrl = this;

    this.state = {
      provider: {},
      overrideConfiguration: false,
      microsoftTenantID: ''
    };

    this.$onInit = onInit;
    this.onSelectProvider = onSelectProvider;
    this.onMicrosoftTenantIDChange = onMicrosoftTenantIDChange;

    function onMicrosoftTenantIDChange() {
      var tenantID = ctrl.state.microsoftTenantID;

      ctrl.settings.AuthorizationURI = _.replace('https://login.microsoftonline.com/TENANT_ID/oauth2/authorize', 'TENANT_ID', tenantID);
      ctrl.settings.AccessTokenURI = _.replace('https://login.microsoftonline.com/TENANT_ID/oauth2/token', 'TENANT_ID', tenantID);
      ctrl.settings.ResourceURI = _.replace('https://graph.windows.net/TENANT_ID/me?api-version=2013-11-08', 'TENANT_ID', tenantID);
    }

    function onSelectProvider(provider) {
      ctrl.state.provider = provider;
      ctrl.settings.AuthorizationURI = provider.authUrl;
      ctrl.settings.AccessTokenURI = provider.accessTokenUrl;
      ctrl.settings.ResourceURI = provider.resourceUrl;
      ctrl.settings.UserIdentifier = provider.userIdentifier;
      ctrl.settings.Scopes = provider.scopes;

      if (provider.name === 'microsoft' && ctrl.state.microsoftTenantID !== '') {
        onMicrosoftTenantIDChange();
      }
    }

    function onInit() {
      if (ctrl.settings.RedirectURI === '') {
        ctrl.settings.RedirectURI = window.location.origin;
      }
      if (ctrl.settings.AuthorizationURI !== '') {
        ctrl.state.provider.authUrl = ctrl.settings.AuthorizationURI;

        if (ctrl.settings.AuthorizationURI.indexOf('login.microsoftonline.com') > -1) {
          var tenantID = ctrl.settings.AuthorizationURI.match(/login.microsoftonline.com\/(.*?)\//)[1];
          ctrl.state.microsoftTenantID = tenantID;
          onMicrosoftTenantIDChange();
        }
      }
    }
  });
