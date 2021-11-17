import { FeatureId } from '@/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/portainer/feature-flags/feature-flags.service';

import providers, { getProviderByUrl } from './providers';

export default class OAuthSettingsController {
  /* @ngInject */
  constructor() {
    this.limitedFeature = FeatureId.HIDE_INTERNAL_AUTH;

    this.state = {
      provider: 'custom',
      overrideConfiguration: false,
      microsoftTenantID: '',
    };

    this.$onInit = this.$onInit.bind(this);
    this.onSelectProvider = this.onSelectProvider.bind(this);
    this.onMicrosoftTenantIDChange = this.onMicrosoftTenantIDChange.bind(this);
    this.useDefaultProviderConfiguration = this.useDefaultProviderConfiguration.bind(this);
    this.updateSSO = this.updateSSO.bind(this);
    this.addTeamMembershipMapping = this.addTeamMembershipMapping.bind(this);
    this.removeTeamMembership = this.removeTeamMembership.bind(this);
  }

  onMicrosoftTenantIDChange() {
    const tenantID = this.state.microsoftTenantID;

    this.settings.AuthorizationURI = `https://login.microsoftonline.com/${tenantID}/oauth2/authorize`;
    this.settings.AccessTokenURI = `https://login.microsoftonline.com/${tenantID}/oauth2/token`;
    this.settings.ResourceURI = `https://graph.windows.net/${tenantID}/me?api-version=2013-11-08`;
  }

  useDefaultProviderConfiguration(providerId) {
    const provider = providers[providerId];

    this.state.overrideConfiguration = false;

    if (!this.isLimitedToBE || providerId === 'custom') {
      this.settings.AuthorizationURI = provider.authUrl;
      this.settings.AccessTokenURI = provider.accessTokenUrl;
      this.settings.ResourceURI = provider.resourceUrl;
      this.settings.LogoutURI = provider.logoutUrl;
      this.settings.UserIdentifier = provider.userIdentifier;
      this.settings.Scopes = provider.scopes;

      if (providerId === 'microsoft' && this.state.microsoftTenantID !== '') {
        this.onMicrosoftTenantIDChange();
      }
    } else {
      this.settings.ClientID = '';
      this.settings.ClientSecret = '';
    }
  }

  onSelectProvider(provider) {
    this.state.provider = provider;

    this.useDefaultProviderConfiguration(provider);
  }

  updateSSO() {
    this.settings.HideInternalAuth = this.settings.SSO;
  }

  addTeamMembershipMapping() {
    this.settings.TeamMemberships.OAuthClaimMappings.push({ ClaimValRegex: '', Team: this.settings.DefaultTeamID });
  }

  removeTeamMembership(index) {
    this.settings.TeamMemberships.OAuthClaimMappings.splice(index, 1);
  }

  $onInit() {
    this.isLimitedToBE = isLimitedToBE(this.limitedFeature);

    if (this.isLimitedToBE) {
      return;
    }

    if (this.settings.RedirectURI === '') {
      this.settings.RedirectURI = window.location.origin;
    }

    if (this.settings.AuthorizationURI) {
      const authUrl = this.settings.AuthorizationURI;

      this.state.provider = getProviderByUrl(authUrl);
      if (this.state.provider === 'microsoft') {
        const tenantID = authUrl.match(/login.microsoftonline.com\/(.*?)\//)[1];
        this.state.microsoftTenantID = tenantID;
        this.onMicrosoftTenantIDChange();
      }
    }

    if (this.settings.DefaultTeamID === 0) {
      this.settings.DefaultTeamID = null;
    }

    if (this.settings.TeamMemberships == null) {
      this.settings.TeamMemberships = {};
    }

    if (this.settings.TeamMemberships.OAuthClaimMappings === null) {
      this.settings.TeamMemberships.OAuthClaimMappings = [];
    }
  }
}
