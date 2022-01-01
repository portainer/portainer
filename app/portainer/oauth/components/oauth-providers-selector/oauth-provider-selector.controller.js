import { buildOption } from '@/portainer/components/BoxSelector';
import { FeatureId } from '@/portainer/feature-flags/enums';

export default class OAuthProviderSelectorController {
  constructor() {
    this.options = [
      buildOption('microsoft', 'fab fa-microsoft', 'Microsoft', 'Microsoft OAuth provider', 'microsoft', FeatureId.HIDE_INTERNAL_AUTH),
      buildOption('google', 'fab fa-google', 'Google', 'Google OAuth provider', 'google', FeatureId.HIDE_INTERNAL_AUTH),
      buildOption('github', 'fab fa-github', 'Github', 'Github OAuth provider', 'github', FeatureId.HIDE_INTERNAL_AUTH),
      buildOption('custom', 'fa fa-user-check', 'Custom', 'Custom OAuth provider', 'custom'),
    ];
  }
}
