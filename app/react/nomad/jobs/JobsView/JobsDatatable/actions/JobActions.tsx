import { useMutation } from 'react-query';
import { Trash2 } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { Job } from '@/react/nomad/types';

import { confirmDelete } from '@@/modals/confirm';
import { LoadingButton } from '@@/buttons/LoadingButton';

import { deleteJobs } from './delete';

interface Props {
  selectedItems: Job[];
  refreshData: () => Promise<void> | void;
}

export function JobActions({ selectedItems, refreshData }: Props) {
  const environmentId = useEnvironmentId();

  const mutation = useMutation(() => deleteJobs(environmentId, selectedItems));

  return (
    <LoadingButton
      loadingText="Removing..."
      isLoading={mutation.isLoading}
      disabled={selectedItems.length < 1 || mutation.isLoading}
      color="danger"
      onClick={handleDeleteClicked}
      icon={Trash2}
    >
      Remove
    </LoadingButton>
  );

  async function handleDeleteClicked() {
    const confirmed = await confirmDelete(
      'Are you sure to delete all selected jobs?'
    );

    if (!confirmed) {
      return;
    }

    mutation.mutate(undefined, {
      onSuccess() {
        return refreshData();
      },
    });
  }
}
