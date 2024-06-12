import _ from 'lodash';

import { Environment } from '@/react/portainer/environments/types';
import {
  UpdateEnvironmentPayload,
  useUpdateEnvironmentMutation,
} from '@/react/portainer/environments/queries/useUpdateEnvironmentMutation';

import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

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
    const hasRemovedTags =
      _.difference(environment.TagIds, values.meta.tagIds || []).length > 0;

    if (hasRemovedTags) {
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
      EdgeCheckinInterval: values.checkInInterval,
      Edge: {
        CommandInterval: values.CommandInterval,
        PingInterval: values.PingInterval,
        SnapshotInterval: values.SnapshotInterval,
      },
    };

    payload.URL = `tcp://${environment.URL}`;

    updateMutation.mutate(
      { id: environment.Id, payload },
      {
        onSuccess: () => onSuccessUpdate(values.name),
      }
    );
  }
}
