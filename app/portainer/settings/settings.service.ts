import { useQuery } from 'react-query';

import { PublicSettingsViewModel } from '@/portainer/models/settings';

import axios, { parseAxiosError } from '../services/axios';

export async function publicSettings() {
  try {
    const { data } = await axios.get(buildUrl('public'));
    return new PublicSettingsViewModel(data);
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve application settings'
    );
  }
}

enum AuthenticationMethod {
  // AuthenticationInternal represents the internal authentication method (authentication against Portainer API)
  AuthenticationInternal,
  // AuthenticationLDAP represents the LDAP authentication method (authentication against a LDAP server)
  AuthenticationLDAP,
  // AuthenticationOAuth represents the OAuth authentication method (authentication against a authorization server)
  AuthenticationOAuth,
}

interface SettingsResponse {
  LogoURL: string;
  BlackListedLabels: { name: string; value: string }[];
  AuthenticationMethod: AuthenticationMethod;
  SnapshotInterval: string;
  TemplatesURL: string;
  EdgeAgentCheckinInterval: number;
  EnableEdgeComputeFeatures: boolean;
  UserSessionTimeout: string;
  KubeconfigExpiry: string;
  EnableTelemetry: boolean;
  HelmRepositoryURL: string;
  KubectlShellImage: string;
  DisableTrustOnFirstConnect: boolean;
  EnforceEdgeID: boolean;
  AgentSecret: string;
}

export async function getSettings() {
  try {
    const { data } = await axios.get<SettingsResponse>(buildUrl());
    return data;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve application settings'
    );
  }
}

export function useSettings<T = SettingsResponse>(
  select?: (settings: SettingsResponse) => T
) {
  return useQuery(['settings'], getSettings, { select });
}

function buildUrl(subResource?: string, action?: string) {
  let url = 'settings';
  if (subResource) {
    url += `/${subResource}`;
  }

  if (action) {
    url += `/${action}`;
  }

  return url;
}
