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
      PublicURL: values.publicUrl,
      GroupID: values.meta.groupId,
      TagIDs: values.meta.tagIds,
    };

    if (environment.Type === EnvironmentType.AgentOnDocker) {
      payload.URL = `tcp://${values.url}`;
    }

    if (environment.Type === EnvironmentType.AgentOnKubernetes) {
      payload.URL = values.url;
    }

    updateMutation.mutate(
      { id: environment.Id, payload },
      {
        onSuccess: () => onSuccessUpdate(values.name),
      }
    );
  }
}
