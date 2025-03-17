import { Edit } from 'lucide-react';
import _ from 'lodash';
import { useCallback, useState } from 'react';

import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

import { DatatableHeader } from '@@/datatables/DatatableHeader';
import { Table } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { createPersistedStore } from '@@/datatables/types';
import { DatatableFooter } from '@@/datatables/DatatableFooter';
import { AddButton } from '@@/buttons';

import { CustomTemplatesListItem } from './CustomTemplatesListItem';

export function CustomTemplatesList({
  templates,
  onDelete,
  selectedId,
  templateLinkParams,
  storageKey,
}: {
  templates?: CustomTemplate[];
  onDelete: (templateId: CustomTemplate['Id']) => void;
  selectedId?: CustomTemplate['Id'];
  templateLinkParams?: (template: CustomTemplate) =>
    | {
        to: string;
        params: object;
      }
    | undefined;
  storageKey: string;
}) {
  const [page, setPage] = useState(0);
  const [store] = useState(() => createPersistedStore(storageKey));
  const listState = useTableState(store, storageKey);

  const filterBySearch = useCallback(
    (item: CustomTemplate) =>
      item.Title.includes(listState.search) ||
      item.Description.includes(listState.search) ||
      item.Note?.includes(listState.search),
    [listState.search]
  );

  const filteredTemplates = templates?.filter(filterBySearch) || [];

  const pagedTemplates =
    _.chunk(filteredTemplates, listState.pageSize)[page] || [];

  return (
    <Table.Container>
      <DatatableHeader
        onSearchChange={listState.setSearch}
        searchValue={listState.search}
        title="Custom Templates"
        titleIcon={Edit}
        renderTableActions={() => (
          <AddButton data-cy="add-custom-template-button">
            Add Custom Template
          </AddButton>
        )}
        data-cy="custom-templates-datatable-header"
      />

      <div className="blocklist gap-y-2 !px-[20px] !pb-[20px]" role="list">
        {pagedTemplates.map((template) => (
          <CustomTemplatesListItem
            key={template.Id}
            template={template}
            isSelected={template.Id === selectedId}
            onDelete={onDelete}
            linkParams={templateLinkParams?.(template)}
          />
        ))}
        {!templates && <div className="text-muted text-center">Loading...</div>}
        {filteredTemplates.length === 0 && (
          <div className="text-muted text-center">No templates available.</div>
        )}
      </div>

      <DatatableFooter
        onPageChange={setPage}
        page={page}
        onPageSizeChange={listState.setPageSize}
        pageSize={listState.pageSize}
        pageCount={Math.ceil(filteredTemplates.length / listState.pageSize)}
        totalSelected={0}
        totalHiddenSelected={0}
      />
    </Table.Container>
  );
}
