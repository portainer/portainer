import _ from 'lodash';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

import { notifySuccess } from '@/portainer/services/notifications';

import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

import { Environment, EnvironmentType } from '../../types';
import {
  UpdateEnvironmentPayload,
  useUpdateEnvironmentMutation,
} from '../../queries/useUpdateEnvironmentMutation';
import { isDockerEnvironment, isKubernetesEnvironment } from '../../utils';

import { FormValues } from './types';

export function useUpdateMutation(
  environment: Environment,
  {
    isEdge,
    isLocal,
    isAzure,
  }: {
    isEdge: boolean;
    isLocal: boolean;
    isAzure: boolean;
  }
) {
  const updateMutation = useUpdateEnvironmentMutation();
  const router = useRouter();
  const { params: stateParams } = useCurrentStateAndParams();

  return {
    handleSubmit,
    isLoading: updateMutation.isLoading,
  };

  async function handleSubmit(values: FormValues) {
    if (
      isEdge &&
      _.difference(environment.TagIds, values.meta.tagIds).length > 0
    ) {
      const confirmed = await confirmDestructive({
        title: 'Confirm action',
        message:
          'Removing tags from this environment will remove the corresponding edge stacks when dynamic grouping is being used',
        confirmButton: buildConfirmButton(),
      });

      if (!confirmed) {
        return;
      }
    }

    const payload: UpdateEnvironmentPayload = {
      Name: values.name,
      PublicURL: values.publicUrl,
      GroupID: values.meta.groupId,
      TagIDs: values.meta.tagIds,
      AzureApplicationID: values.azure.applicationId,
      AzureTenantID: values.azure.tenantId,
      AzureAuthenticationKey: values.azure.authKey,
      EdgeCheckinInterval: values.edge.checkInInterval,
      Edge: {
        CommandInterval: values.edge.CommandInterval,
        PingInterval: values.edge.PingInterval,
        SnapshotInterval: values.edge.SnapshotInterval,
      },
    };

    if (isLocal && !isAzure && !isKubernetesEnvironment(environment.Type)) {
      payload.URL = `tcp://${values.url}`;

      if (isDockerEnvironment(environment.Type)) {
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

    if (environment.Type === EnvironmentType.AgentOnKubernetes) {
      payload.URL = values.url;
    }

    if (environment.Type === EnvironmentType.KubernetesLocal) {
      payload.URL = `https://${values.url}`;
    }

    updateMutation.mutate(
      { id: environment.Id, payload },
      {
        onSuccess() {
          notifySuccess('Environment updated', environment.Name);
          router.stateService.go(stateParams.redirectTo || '^');
        },
      }
    );
  }
}
