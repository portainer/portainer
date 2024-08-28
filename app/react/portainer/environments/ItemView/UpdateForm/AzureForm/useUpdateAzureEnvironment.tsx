import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  UpdateEnvironmentPayload,
  useUpdateEnvironmentMutation,
} from '@/react/portainer/environments/queries/useUpdateEnvironmentMutation';

import { FormValues } from './types';

export function useUpdateAzureEnvironment(
  envId: EnvironmentId,
  onSuccessUpdate: (name: string) => void
) {
  const updateMutation = useUpdateEnvironmentMutation();

  return {
    handleSubmit,
    isLoading: updateMutation.isLoading,
  };

  async function handleSubmit(values: FormValues) {
    const payload: UpdateEnvironmentPayload = {
      Name: values.name,
      GroupID: values.meta.groupId,
      TagIDs: values.meta.tagIds,
      AzureApplicationID: values.applicationId,
      AzureTenantID: values.tenantId,
      AzureAuthenticationKey: values.authKey,
    };

    updateMutation.mutate(
      { id: envId, payload },
      {
        onSuccess: () => onSuccessUpdate(values.name),
      }
    );
  }
}
