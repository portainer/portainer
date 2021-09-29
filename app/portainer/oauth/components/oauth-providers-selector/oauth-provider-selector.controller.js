import { buildOption } from 'Portainer/components/box-selector';

export default class OAuthProviderSelectorController {
  constructor() {
    this.options = [
      buildOption('microsoft', 'fab fa-microsoft', 'Microsoft', 'Microsoft OAuth provider', 'microsoft'),
      buildOption('google', 'fab fa-google', 'Google', 'Google OAuth provider', 'google'),
      buildOption('github', 'fab fa-github', 'Github', 'Github OAuth provider', 'github'),
      buildOption('custom', 'fa fa-user-check', 'Custom', 'Custom OAuth provider', 'custom'),
    ];
  }
}
