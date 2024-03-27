import { TagIcon } from 'lucide-react';
import { useStore } from 'zustand';

import { Datatable } from '@@/datatables';
import { useTableStateWithStorage } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';
import { withMeta } from '@@/datatables/extend-options/withMeta';

import { Tag } from './types';
import { useColumns } from './columns/useColumns';
import { newNamesStore } from './useRetagState';
import { RepositoryTagViewModel } from './view-model';

export function TagsDatatable({
  dataset,
  advancedFeaturesAvailable,
  onRemove,
  onRetag,
}: {
  dataset?: Tag[];
  advancedFeaturesAvailable: boolean;
  onRemove: (tags: Tag[]) => void;
  onRetag: (tags: Record<string, RepositoryTagViewModel>) => Promise<void>;
}) {
  const updatesState = useStore(newNamesStore);

  const tableState = useTableStateWithStorage('registryRepositoryTags', 'name');
  const columns = useColumns(advancedFeaturesAvailable);

  return (
    <Datatable
      title="Tags"
      titleIcon={TagIcon}
      columns={columns}
      dataset={dataset || []}
      isLoading={!dataset}
      settingsManager={tableState}
      emptyContentLabel="No tags available."
      renderTableActions={(selectedItems) =>
        advancedFeaturesAvailable && (
          <DeleteButton
            confirmMessage="Are you sure you want to remove the selected tags?"
            onConfirmed={() => onRemove(selectedItems)}
          />
        )
      }
      getRowId={(tag) => tag.Name}
      extendTableOptions={withMeta({
        onUpdate: async () => {
          await onRetag(updatesState.updates);
          updatesState.clear();
        },
        table: 'registry-repository-tags',
      })}
    />
  );
}
