import {
  Environment,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import {
  UpdateEnvironmentPayload,
  useUpdateEnvironmentMutation,
} from '@/react/portainer/environments/queries/useUpdateEnvironmentMutation';

import { FormValues } from './types';

export function useUpdateMutation(
  environment: Environment,
  onSuccessUpdate: (name: string) => void,
  {
    isDockerApi,
    isLocal,
  }: {
    isDockerApi: boolean;
    isLocal: boolean;
  }
) {
  const updateMutation = useUpdateEnvironmentMutation();

  return {
    handleSubmit,
    isLoading: updateMutation.isLoading,
  };

  async function handleSubmit(values: FormValues) {
    const payload: UpdateEnvironmentPayload = {
      Name: values.name,
      PublicURL: values.publicUrl,
      GroupID: values.meta.groupId,
      TagIDs: values.meta.tagIds,
    };

    if (!isLocal) {
      payload.URL = `tcp://${values.url}`;

      if (isDockerApi) {
        const { tlsConfig } = values;
        payload.TLS = tlsConfig.tls;
        payload.TLSSkipVerify = tlsConfig.skipVerify || false;
        if (tlsConfig.tls && !tlsConfig.skipVerify) {
          // payload.TLSSkipClientVerify = tlsConfig.skipClientVerify;
          payload.TLSCACert = tlsConfig.caCertFile;
          payload.TLSCert = tlsConfig.certFile;
          payload.TLSKey = tlsConfig.keyFile;
        }
      }
    }

    if (environment.Type === EnvironmentType.KubernetesLocal) {
      payload.URL = `https://${environment.URL}`;
    }

    updateMutation.mutate(
      { id: environment.Id, payload },
      {
        onSuccess: () => onSuccessUpdate(values.name),
      }
    );
  }
}
