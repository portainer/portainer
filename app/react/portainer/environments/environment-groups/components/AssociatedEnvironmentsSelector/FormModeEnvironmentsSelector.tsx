import { useState } from 'react';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { FormSection } from '@@/form-components/FormSection';

import { EnvironmentTableData } from './types';
import { AssociatedEnvironmentsTable } from './AssociatedEnvironmentsTable';
import { AddEnvironmentsDrawer } from './AddEnvironmentsDrawer';

interface Props {
  selectedIds: EnvironmentId[];
  onChange(ids: EnvironmentId[]): void;
}

/**
 * Similar to AssociatedEnvironmentsSelector, but instead of making API calls and getting the environment list from the server, it holds the the selected environments and ids in local state.
 *
 * This is because on create, there is no group to add / remove environments from yet.
 */
export function FormModeEnvironmentsSelector({ selectedIds, onChange }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEnvironments, setSelectedEnvironments] = useState<
    EnvironmentTableData[]
  >([]);

  return (
    <FormSection title="Associate environments">
      <p className="small text-muted">
        Assocate environments to this group by clicking the add button below.
      </p>
      <AssociatedEnvironmentsTable
        title="Associated environments"
        environments={selectedEnvironments}
        onRemove={handleRemove}
        onOpenAddDrawer={() => setDrawerOpen(true)}
        confirmRemove={false}
        data-cy="group-associatedEndpoints"
      />

      <AddEnvironmentsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        excludeIds={selectedIds}
        onAdd={handleAdd}
      />
    </FormSection>
  );

  async function handleRemove(toRemove: EnvironmentTableData[]) {
    const removeIds = new Set(toRemove.map((env) => env.Id));
    setSelectedEnvironments((prev) => prev.filter((e) => !removeIds.has(e.Id)));
    onChange(selectedIds.filter((id) => !removeIds.has(id)));
  }

  function handleAdd(newEnvs: EnvironmentTableData[]) {
    const existingIds = new Set(selectedIds);
    const toAdd = newEnvs.filter((e) => !existingIds.has(e.Id));
    setSelectedEnvironments((prev) => [...prev, ...toAdd]);
    onChange([...selectedIds, ...toAdd.map((e) => e.Id)]);
  }
}
