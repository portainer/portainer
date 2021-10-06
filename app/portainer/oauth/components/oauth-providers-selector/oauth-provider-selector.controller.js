import { HIDE_INTERNAL_AUTH } from '@/portainer/feature-flags/feature-ids';

import { buildOption } from '@/portainer/components/box-selector';

export default class OAuthProviderSelectorController {
  constructor() {
    this.options = [
      buildOption('microsoft', 'fab fa-microsoft', 'Microsoft', 'Microsoft OAuth provider', 'microsoft', HIDE_INTERNAL_AUTH),
      buildOption('google', 'fab fa-google', 'Google', 'Google OAuth provider', 'google', HIDE_INTERNAL_AUTH),
      buildOption('github', 'fab fa-github', 'Github', 'Github OAuth provider', 'github', HIDE_INTERNAL_AUTH),
      buildOption('custom', 'fa fa-user-check', 'Custom', 'Custom OAuth provider', 'custom'),
    ];
  }
}
