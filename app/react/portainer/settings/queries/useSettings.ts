import { useQuery } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildUrl } from '../build-url';
import {
  EdgeSettings,
  ExperimentalFeatures,
  FDOConfiguration,
  GlobalDeploymentOptions,
  InternalAuthSettings,
  LDAPSettings,
  OAuthSettings,
  OpenAMTConfiguration,
  Pair,
} from '../types';

import { queryKeys } from './queryKeys';
import { PublicSettingsResponse } from './usePublicSettings';

interface AuthenticatedResponse extends PublicSettingsResponse {
  /** Deployment options for encouraging git ops workflows */
  GlobalDeploymentOptions: GlobalDeploymentOptions;
  /** Whether edge compute features are enabled */
  EnableEdgeComputeFeatures: boolean;
  /** The expiry of a Kubeconfig */
  KubeconfigExpiry: string;

  DefaultRegistry: {
    Hide: boolean;
  };
  /** Helm repository URL, defaults to "https://charts.bitnami.com/bitnami" */
  HelmRepositoryURL: string;
  /** Experimental features */
  ExperimentalFeatures: ExperimentalFeatures;

  isAMTEnabled: boolean;
  isFDOEnabled: boolean;
}

interface EdgeAdminResponse extends AuthenticatedResponse {
  /** Only available for edge-admins */
  Edge?: EdgeSettings;
  /**
   * TrustOnFirstConnect makes Portainer accepting edge agent connection by default
   *
   * Only available for edge-admins
   * */
  TrustOnFirstConnect: boolean;
  /**
   * EnforceEdgeID makes Portainer store the Edge ID instead of accepting anyone
   *
   * Only available for edge-admins
   * */
  EnforceEdgeID: boolean;
  /**
   * EdgePortainerUrl is the URL that is exposed to edge agents
   *
   * Only available for edge-admins
   * */
  EdgePortainerUrl: string;
  /**
   * The default check in interval for edge agent (in seconds)
   *
   * Only available for edge-admins
   * */
  EdgeAgentCheckinInterval: number;
}

interface AdminResponse extends EdgeAdminResponse {
  /**
   * A list of label name & value that will be used to hide containers when querying containers
   *
   * Only available for admins
   * */
  BlackListedLabels?: Pair[];
  /** Only available for admins */
  LDAPSettings?: LDAPSettings;
  /** Only available for admins */
  OAuthSettings?: OAuthSettings;
  /** Only available for admins */
  InternalAuthSettings?: InternalAuthSettings;
  /** Only available for admins */
  openAMTConfiguration?: OpenAMTConfiguration;
  /** Only available for admins */
  fdoConfiguration?: FDOConfiguration;
  /**
   * The interval in which environment(endpoint) snapshots are created
   *
   * Only available for admins
   * */
  SnapshotInterval: string;
  /**
   * URL to the templates that will be displayed in the UI when navigating to App Templates
   *
   * Only available for admins
   * */
  TemplatesURL: string;
  /**
   * The duration of a user session
   *
   * Only available for admins
   * */
  UserSessionTimeout: string;
  /**
   * KubectlImage, defaults to portainer/kubectl-shell
   *
   * Only available for admins
   * */
  KubectlShellImage: string;
  /**
   * Container environment parameter AGENT_SECRET
   *
   * Only available for admins
   * */
  AgentSecret: string;
}

interface SettingsResponse extends AdminResponse {}

export function useSettings<T = SettingsResponse>({
  enabled,
  select,
}: {
  select?: (settings: SettingsResponse) => T;
  enabled?: boolean;
} = {}) {
  return useQuery(queryKeys.base(), getSettings, {
    select,
    enabled,
    staleTime: 50,
    ...withError('Unable to retrieve settings'),
  });
}

export async function getSettings() {
  try {
    const { data } = await axios.get<SettingsResponse>(buildUrl());
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to retrieve application settings');
  }
}
