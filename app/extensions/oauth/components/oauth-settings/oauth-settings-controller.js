import _ from 'lodash-es';

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
    this.useDefaultProviderConfiguration = useDefaultProviderConfiguration;

    function onMicrosoftTenantIDChange() {
      var tenantID = ctrl.state.microsoftTenantID;

      ctrl.settings.AuthorizationURI = _.replace('https://login.microsoftonline.com/TENANT_ID/oauth2/authorize', 'TENANT_ID', tenantID);
      ctrl.settings.AccessTokenURI = _.replace('https://login.microsoftonline.com/TENANT_ID/oauth2/token', 'TENANT_ID', tenantID);
      ctrl.settings.ResourceURI = _.replace('https://graph.windows.net/TENANT_ID/me?api-version=2013-11-08', 'TENANT_ID', tenantID);
    }

    function useDefaultProviderConfiguration() {
      ctrl.settings.AuthorizationURI = ctrl.state.provider.authUrl;
      ctrl.settings.AccessTokenURI = ctrl.state.provider.accessTokenUrl;
      ctrl.settings.ResourceURI = ctrl.state.provider.resourceUrl;
      ctrl.settings.UserIdentifier = ctrl.state.provider.userIdentifier;
      ctrl.settings.Scopes = ctrl.state.provider.scopes;

      if (ctrl.state.provider.name === 'microsoft' && ctrl.state.microsoftTenantID !== '') {
        onMicrosoftTenantIDChange();
      }
    }

    function useExistingConfiguration() {
      var provider = ctrl.state.provider;
      ctrl.settings.AuthorizationURI = ctrl.settings.AuthorizationURI === '' ? provider.authUrl : ctrl.settings.AuthorizationURI;
      ctrl.settings.AccessTokenURI = ctrl.settings.AccessTokenURI === '' ? provider.accessTokenUrl : ctrl.settings.AccessTokenURI;
      ctrl.settings.ResourceURI = ctrl.settings.ResourceURI === '' ? provider.resourceUrl : ctrl.settings.ResourceURI;
      ctrl.settings.UserIdentifier = ctrl.settings.UserIdentifier === '' ? provider.userIdentifier : ctrl.settings.UserIdentifier;
      ctrl.settings.Scopes = ctrl.settings.Scopes === '' ? provider.scopes : ctrl.settings.Scopes;

      if (provider.name === 'microsoft' && ctrl.state.microsoftTenantID !== '') {
        onMicrosoftTenantIDChange();
      }
    }

    function onSelectProvider(provider, overrideConfiguration) {
      ctrl.state.provider = provider;

      if (overrideConfiguration) {
        useDefaultProviderConfiguration();
      } else {
        useExistingConfiguration();
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
