import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildUrl } from '../build-url';
import { AuthenticationMethod } from '../types';

import { queryKeys } from './queryKeys';

export interface PublicSettingsResponse {
  /**
   * URL to a logo that will be displayed on the login page as well as on top of the sidebar. Will use default Portainer logo when value is empty string
   * @example "https://mycompany.mydomain.tld/logo.png"
   */
  LogoURL: string;

  /**
   * Whether telemetry is enabled
   * @example true
   */
  EnableTelemetry: boolean;

  /**
   * The content in plaintext used to display in the login page. Will hide when value is empty string
   * @example "notice or agreement"
   */
  CustomLoginBanner: string;

  /**
   * Active authentication method for the Portainer instance. Valid values are: 1 for internal, 2 for LDAP, or 3 for oauth
   * @example 1
   */
  AuthenticationMethod: AuthenticationMethod;

  /**
   * The URL used for oauth login
   * @example "https://gitlab.com/oauth"
   */
  OAuthLoginURI: string;

  /**
   * Whether portainer internal auth view will be hidden
   * @example true
   */
  OAuthHideInternalAuth: boolean;

  /**
   * The minimum required length for a password of any user when using internal auth mode
   * @example 1
   */
  RequiredPasswordLength: number;

  /**
   * The URL used for oauth logout
   * @example "https://gitlab.com/oauth/logout"
   */
  OAuthLogoutURI: string;

  /**
   * Whether team sync is enabled
   * @example true
   */
  TeamSync: boolean;

  /**
   * Supported feature flags
   */
  Features: Record<string, boolean>;
}

export function usePublicSettings<T = PublicSettingsResponse>({
  enabled,
  select,
  onSuccess,
}: {
  select?: (settings: PublicSettingsResponse) => T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
} = {}) {
  return useQuery(queryKeys.public(), getPublicSettings, {
    select,
    ...withError('Unable to retrieve public settings'),
    enabled,
    onSuccess,
  });
}

export async function getPublicSettings() {
  try {
    const { data } = await axios.get<PublicSettingsResponse>(
      buildUrl('public')
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve application settings');
  }
}
