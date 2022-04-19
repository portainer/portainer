import { useMutation, useQuery, useQueryClient } from 'react-query';

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

export interface Settings {
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
  TrustOnFirstConnect: boolean;
  EnforceEdgeID: boolean;
  AgentSecret: string;
  EdgePortainerUrl: string;
}

export async function getSettings() {
  try {
    const { data } = await axios.get<Settings>(buildUrl());
    return data;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve application settings'
    );
  }
}

async function updateSettings(settings: Partial<Settings>) {
  try {
    await axios.put(buildUrl(), settings);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update application settings');
  }
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation(updateSettings, {
    onSuccess() {
      return queryClient.invalidateQueries(['settings']);
    },
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to update settings',
      },
    },
  });
}

export function useSettings<T = Settings>(select?: (settings: Settings) => T) {
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
