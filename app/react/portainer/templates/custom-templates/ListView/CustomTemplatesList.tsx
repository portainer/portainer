import { Edit, Plus } from 'lucide-react';
import _ from 'lodash';
import { useCallback, useState } from 'react';

import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

import { DatatableHeader } from '@@/datatables/DatatableHeader';
import { Table } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { createPersistedStore } from '@@/datatables/types';
import { DatatableFooter } from '@@/datatables/DatatableFooter';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { CustomTemplatesListItem } from './CustomTemplatesListItem';

const tableKey = 'custom-templates-list';
const store = createPersistedStore(tableKey);

export function CustomTemplatesList({
  templates,
  onSelect,
  onDelete,
  selectedId,
}: {
  templates?: CustomTemplate[];
  onSelect: (template: CustomTemplate['Id']) => void;
  onDelete: (template: CustomTemplate['Id']) => void;
  selectedId: CustomTemplate['Id'] | undefined;
}) {
  const [page, setPage] = useState(0);

  const listState = useTableState(store, tableKey);

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
          <Button as={Link} props={{ to: '.new' }} icon={Plus}>
            Add Custom Template
          </Button>
        )}
      />

      <div className="blocklist gap-y-2 !px-[20px] !pb-[20px]">
        {pagedTemplates.map((template) => (
          <CustomTemplatesListItem
            key={template.Id}
            template={template}
            onSelect={onSelect}
            isSelected={template.Id === selectedId}
            onDelete={onDelete}
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
      />
    </Table.Container>
  );
}
