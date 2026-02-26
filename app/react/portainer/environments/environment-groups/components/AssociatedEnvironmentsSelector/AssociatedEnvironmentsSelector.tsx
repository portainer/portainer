import { useState } from 'react';

import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { EnvironmentGroupId } from '@/react/portainer/environments/types';

import { openConfirm } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

import { useGroup } from '../../queries/useGroup';
import { useUpdateGroupMutation } from '../../queries/useUpdateGroupMutation';

import { EnvironmentTableData } from './types';
import { AssociatedEnvironmentsTable } from './AssociatedEnvironmentsTable';
import { AddEnvironmentsDrawer } from './AddEnvironmentsDrawer';

interface Props {
  groupId: EnvironmentGroupId;
  /* For unassigned group, don't show the add/remove buttons and hide the checkbox */
  readOnly: boolean;
}

export function AssociatedEnvironmentsSelector({ groupId, readOnly }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const groupQuery = useGroup(groupId);
  const environmentsQuery = useEnvironmentList({
    groupIds: [groupId],
    pageLimit: 0,
  });
  const updateMutation = useUpdateGroupMutation();

  const currentEnvironments = environmentsQuery.environments ?? [];
  const currentIds = currentEnvironments.map((e) => e.Id);

  return (
    <>
      <AssociatedEnvironmentsTable
        title="Associated environments"
        environments={currentEnvironments}
        isLoading={environmentsQuery.isLoading}
        onRemove={handleRemove}
        onOpenAddDrawer={() => setDrawerOpen(true)}
        isRemoving={updateMutation.isLoading}
        data-cy="group-associatedEndpoints"
        readOnly={readOnly}
      />

      <AddEnvironmentsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        excludeGroupIds={[groupId]}
        onAdd={handleAdd}
        isLoading={updateMutation.isLoading}
      />
    </>
  );

  function handleRemove(selected: EnvironmentTableData[]) {
    const selectedIds = new Set(selected.map((e) => e.Id));
    const remainingIds = currentIds.filter((id) => !selectedIds.has(id));

    updateMutation.mutate({
      id: groupId,
      name: groupQuery.data?.Name ?? '',
      description: groupQuery.data?.Description,
      tagIds: groupQuery.data?.TagIds,
      associatedEnvironments: remainingIds,
    });
  }

  async function handleAdd(newEnvs: EnvironmentTableData[]): Promise<boolean> {
    const confirmed = await openConfirm({
      title: 'Are you sure?',
      message: `Are you sure you want to add the selected environment(s) to this group?`,
      confirmButton: buildConfirmButton('Add'),
    });

    if (!confirmed) return false;

    const mergedIds = [
      ...new Set([...currentIds, ...newEnvs.map((e) => e.Id)]),
    ];

    updateMutation.mutate({
      id: groupId,
      name: groupQuery.data?.Name ?? '',
      description: groupQuery.data?.Description,
      tagIds: groupQuery.data?.TagIds,
      associatedEnvironments: mergedIds,
    });

    return true;
  }
}
