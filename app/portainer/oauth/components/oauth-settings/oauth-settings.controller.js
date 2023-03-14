import { baseHref } from '@/portainer/helpers/pathHelper';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { ModalType } from '@@/modals';
import { confirm } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

import providers, { getProviderByUrl } from './providers';

const MS_TENANT_ID_PLACEHOLDER = 'TENANT_ID';

export default class OAuthSettingsController {
  /* @ngInject */
  constructor($scope, $async) {
    Object.assign(this, { $scope, $async });

    this.limitedFeature = FeatureId.HIDE_INTERNAL_AUTH;
    this.limitedFeatureClass = 'limited-be';

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
    this.onToggleAutoTeamMembership = this.onToggleAutoTeamMembership.bind(this);
  }

  onMicrosoftTenantIDChange() {
    const tenantID = this.state.microsoftTenantID || MS_TENANT_ID_PLACEHOLDER;

    this.settings.AuthorizationURI = `https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/authorize`;
    this.settings.AccessTokenURI = `https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/token`;
    this.settings.ResourceURI = `https://graph.microsoft.com/v1.0/me`;
    this.settings.LogoutURI = `https://login.microsoftonline.com/${tenantID}/oauth2/v2.0/logout`;
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

  updateSSO(checked) {
    this.$scope.$evalAsync(() => {
      this.settings.SSO = checked;
      this.settings.HideInternalAuth = false;
    });
  }

  async onChangeHideInternalAuth(checked) {
    this.$async(async () => {
      if (this.isLimitedToBE) {
        return;
      }

      if (checked) {
        const confirmed = await confirm({
          title: 'Hide internal authentication prompt',
          message: 'By hiding internal authentication prompt, you will only be able to login via SSO. Are you sure?',
          confirmButton: buildConfirmButton('Confirm', 'danger'),
          modalType: ModalType.Warn,
        });

        if (!confirmed) {
          return;
        }
      }

      this.settings.HideInternalAuth = checked;
    });
  }

  onToggleAutoTeamMembership(checked) {
    this.$scope.$evalAsync(() => {
      this.settings.OAuthAutoMapTeamMemberships = checked;
    });
  }

  addTeamMembershipMapping() {
    this.settings.TeamMemberships.OAuthClaimMappings.push({ ClaimValRegex: '', Team: this.settings.DefaultTeamID });
  }

  removeTeamMembership(index) {
    this.settings.TeamMemberships.OAuthClaimMappings.splice(index, 1);
  }

  isOAuthTeamMembershipFormValid() {
    if (this.settings.OAuthAutoMapTeamMemberships && this.settings.TeamMemberships) {
      if (!this.settings.TeamMemberships.OAuthClaimName) {
        return false;
      }

      const hasInvalidMapping = this.settings.TeamMemberships.OAuthClaimMappings.some((m) => !(m.ClaimValRegex && m.Team));
      if (hasInvalidMapping) {
        return false;
      }
    }
    return true;
  }

  $onInit() {
    this.isLimitedToBE = isLimitedToBE(this.limitedFeature);

    if (this.isLimitedToBE) {
      return;
    }

    if (this.settings.RedirectURI === '') {
      this.settings.RedirectURI = window.location.origin + baseHref();
    }

    if (this.settings.AuthorizationURI) {
      const authUrl = this.settings.AuthorizationURI;

      this.state.provider = getProviderByUrl(authUrl);
      if (this.state.provider === 'microsoft') {
        const tenantID = authUrl.match(/login.microsoftonline.com\/(.*?)\//)[1];
        if (tenantID !== MS_TENANT_ID_PLACEHOLDER) {
          this.state.microsoftTenantID = tenantID;
          this.onMicrosoftTenantIDChange();
        }
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
