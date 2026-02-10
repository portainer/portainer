import {
  Environment,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import { UpdateEnvironmentPayload } from '@/react/portainer/environments/queries/useUpdateEnvironmentMutation';
import { stripProtocol } from '@/react/common/string-utils';

import { isDockerAPIEnvironment, isLocalDockerEnvironment } from '../../utils';

import { GeneralEnvironmentFormValues } from './types';

export function buildInitialValues(
  environment: Environment
): GeneralEnvironmentFormValues {
  const isDockerAPI = isDockerAPIEnvironment(environment);
  const isLocalDocker = isLocalDockerEnvironment(environment.URL);
  return {
    name: environment.Name,
    environmentUrl: isLocalDocker
      ? environment.URL
      : stripProtocol(environment.URL),
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

export function buildUpdatePayload({
  environmentType,
  values,
}: {
  values: GeneralEnvironmentFormValues;
  environmentType: EnvironmentType;
}): Partial<UpdateEnvironmentPayload> {
  return {
    Name: values.name,
    PublicURL: values.publicUrl,
    GroupID: values.meta.groupId,
    TagIds: values.meta.tagIds,

    URL: formatURL({
      url: values.environmentUrl,
      environmentType,
    }),

    TLS: values.tls?.tls,
    TLSSkipVerify: values.tls?.skipVerify,
    TLSSkipClientVerify: values.tls?.skipVerify,
    TLSCACert: values.tls?.caCertFile,
    TLSCert: values.tls?.certFile,
    TLSKey: values.tls?.keyFile,
  };
}

export function formatURL({
  environmentType,
  url,
}: {
  url: string;
  environmentType: EnvironmentType;
}) {
  if (!url || isLocalDockerEnvironment(url)) {
    return url;
  }

  const stripped = stripProtocol(url);

  if (environmentType === EnvironmentType.KubernetesLocal) {
    return `https://${stripped}`;
  }

  if (environmentType === EnvironmentType.AgentOnKubernetes) {
    return stripped;
  }

  return `tcp://${stripped}`;
}
