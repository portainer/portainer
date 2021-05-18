angular.module('portainer.oauth').controller('OAuthSettingsController', function OAuthSettingsController() {
  const ctrl = this;

  this.state = {
    provider: {},
    overrideConfiguration: false,
    microsoftTenantID: '',
  };

  this.$onInit = $onInit;
  this.onSelectProvider = onSelectProvider;
  this.onMicrosoftTenantIDChange = onMicrosoftTenantIDChange;
  this.useDefaultProviderConfiguration = useDefaultProviderConfiguration;
  this.updateSSO = updateSSO;
  this.addTeamMembershipMapping = addTeamMembershipMapping;
  this.removeTeamMembership = removeTeamMembership;

  function onMicrosoftTenantIDChange() {
    const tenantID = ctrl.state.microsoftTenantID;

    ctrl.settings.AuthorizationURI = `https://login.microsoftonline.com/${tenantID}/oauth2/authorize`;
    ctrl.settings.AccessTokenURI = `https://login.microsoftonline.com/${tenantID}/oauth2/token`;
    ctrl.settings.ResourceURI = `https://graph.windows.net/${tenantID}/me?api-version=2013-11-08`;
  }

  function useDefaultProviderConfiguration() {
    ctrl.state.overrideConfiguration = false;
    ctrl.settings.AuthorizationURI = ctrl.state.provider.authUrl;
    ctrl.settings.AccessTokenURI = ctrl.state.provider.accessTokenUrl;
    ctrl.settings.ResourceURI = ctrl.state.provider.resourceUrl;
    ctrl.settings.LogoutURI = ctrl.state.provider.logoutUrl;
    ctrl.settings.UserIdentifier = ctrl.state.provider.userIdentifier;
    ctrl.settings.Scopes = ctrl.state.provider.scopes;

    if (ctrl.state.provider.name === 'microsoft' && ctrl.state.microsoftTenantID !== '') {
      onMicrosoftTenantIDChange();
    }
  }

  function useExistingConfiguration() {
    const provider = ctrl.state.provider;
    ctrl.settings.AuthorizationURI = ctrl.settings.AuthorizationURI || provider.authUrl;
    ctrl.settings.AccessTokenURI = ctrl.settings.AccessTokenURI || provider.accessTokenUrl;
    ctrl.settings.ResourceURI = ctrl.settings.ResourceURI || provider.resourceUrl;
    ctrl.settings.LogoutURI = ctrl.settings.LogoutURI || ctrl.state.provider.logoutUrl;
    ctrl.settings.UserIdentifier = ctrl.settings.UserIdentifier || provider.userIdentifier;
    ctrl.settings.Scopes = ctrl.settings.Scopes || provider.scopes;
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

  function updateSSO() {
    ctrl.settings.HideInternalAuth = ctrl.settings.SSO;
  }
  
  function addTeamMembershipMapping() {
    ctrl.settings.TeamMemberships.OAuthClaimMappings.push({ ClaimValRegex: '', Team: ctrl.settings.DefaultTeamID });
  }

  function removeTeamMembership(index) {
    ctrl.settings.TeamMemberships.OAuthClaimMappings.splice(index, 1);
  }

  function $onInit() {
    if (ctrl.settings.RedirectURI === '') {
      ctrl.settings.RedirectURI = window.location.origin;
    }

    if (ctrl.settings.AuthorizationURI !== '') {
      ctrl.state.provider.authUrl = ctrl.settings.AuthorizationURI;
      if (ctrl.settings.AuthorizationURI.indexOf('login.microsoftonline.com') > -1) {
        const tenantID = ctrl.settings.AuthorizationURI.match(/login.microsoftonline.com\/(.*?)\//)[1];
        ctrl.state.microsoftTenantID = tenantID;
        onMicrosoftTenantIDChange();
      }
    }

    if (ctrl.settings.DefaultTeamID === 0) {
      ctrl.settings.DefaultTeamID = null;
    }

    if (ctrl.settings.TeamMemberships.OAuthClaimMappings === null) {
      ctrl.settings.TeamMemberships.OAuthClaimMappings = [];
    }
  }
});
