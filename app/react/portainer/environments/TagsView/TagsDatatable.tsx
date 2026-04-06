import { TagIcon } from 'lucide-react';
import { createColumnHelper } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { Tag } from '@/portainer/tags/types';
import i18n from '@/i18n';

import { Datatable } from '@@/datatables';
import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { DeleteButton } from '@@/buttons/DeleteButton';

const columnHelper = createColumnHelper<Tag>();

const columns = [
  columnHelper.accessor('Name', {
    header: () => i18n.t('tags.col_name'),
  }),
];

const tableKey = 'tags-table';

const store = createPersistedStore(tableKey);

export function TagsDatatable({
  dataset,
  onRemove,
}: {
  dataset: Array<Tag> | undefined;
  onRemove: (selectedItems: Array<Tag>) => void;
}) {
  const { t } = useTranslation();
  const tableState = useTableState(store, tableKey);

  return (
    <Datatable
      title={t('tags.tags_title')}
      titleIcon={TagIcon}
      dataset={dataset || []}
      columns={columns}
      isLoading={!dataset}
      settingsManager={tableState}
      renderTableActions={(selectedItems) => (
        <DeleteButton
          disabled={selectedItems.length === 0}
          confirmMessage={t('tags.remove_confirm_tags')}
          onConfirmed={() => onRemove(selectedItems)}
          data-cy="remove-tag-button"
        />
      )}
      data-cy="tags-datatable"
    />
  );
}
