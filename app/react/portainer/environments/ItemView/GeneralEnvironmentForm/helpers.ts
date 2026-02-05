import {
  Environment,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import { UpdateEnvironmentPayload } from '@/react/portainer/environments/queries/useUpdateEnvironmentMutation';
import { stripProtocol } from '@/react/common/string-utils';

import { isDockerAPIEnvironment } from '../../utils';

import { GeneralEnvironmentFormValues } from './types';

export function buildInitialValues(
  environment: Environment
): GeneralEnvironmentFormValues {
  const isDockerAPI = isDockerAPIEnvironment(environment);

  return {
    name: environment.Name,
    environmentUrl: stripProtocol(environment.URL),
    publicUrl: environment.PublicURL || '',

    meta: {
      groupId: environment.GroupId,
      tagIds: environment.TagIds || [],
    },

    tls: isDockerAPI
      ? {
          tls: environment.TLSConfig?.TLS || false,
          skipVerify: environment.TLSConfig?.TLSSkipVerify || false,
          caCertFile: undefined,
          certFile: undefined,
          keyFile: undefined,
        }
      : undefined,
  };
}

export function buildUpdatePayload(
  values: GeneralEnvironmentFormValues,
  environmentType: EnvironmentType
): Partial<UpdateEnvironmentPayload> {
  return {
    Name: values.name,
    PublicURL: values.publicUrl,
    GroupID: values.meta.groupId,
    TagIds: values.meta.tagIds,

    URL: formatURL(values.environmentUrl, environmentType),

    TLS: values.tls?.tls,
    TLSSkipVerify: values.tls?.skipVerify,
    TLSSkipClientVerify: values.tls?.skipVerify,
    TLSCACert: values.tls?.caCertFile,
    TLSCert: values.tls?.certFile,
    TLSKey: values.tls?.keyFile,
  };
}

// URL Formatting Logic (from Angular controller lines 195-242)
export function formatURL(url: string, type: EnvironmentType): string {
  if (!url) return '';

  // Strip any existing protocol
  const stripped = stripProtocol(url);

  // Kubernetes Local - prefix https://
  if (type === EnvironmentType.KubernetesLocal) {
    return `https://${stripped}`;
  }

  // Agent on Kubernetes - use as-is
  if (type === EnvironmentType.AgentOnKubernetes) {
    return stripped;
  }

  // Default (Docker) - prefix tcp://
  return `tcp://${stripped}`;
}
