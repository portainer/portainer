import { Edit } from 'lucide-react';
import _ from 'lodash';
import { useState } from 'react';
import { useRouter } from '@uirouter/react';

import { DatatableHeader } from '@@/datatables/DatatableHeader';
import { Table } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { createPersistedStore } from '@@/datatables/types';
import { DatatableFooter } from '@@/datatables/DatatableFooter';

import { AppTemplatesListItem } from './AppTemplatesListItem';
import { TemplateViewModel } from './view-model';
import { ListState } from './types';
import { useSortAndFilterTemplates } from './useSortAndFilter';
import { Filters } from './Filters';
import { useFetchTemplateInfoMutation } from './useFetchTemplateInfoMutation';

const tableKey = 'app-templates-list';
const store = createPersistedStore<ListState>(tableKey, undefined, (set) => ({
  category: null,
  setCategory: (category: ListState['category']) => set({ category }),
  type: null,
  setType: (type: ListState['type']) => set({ type }),
}));

export function AppTemplatesList({
  templates,
  onSelect,
  selectedId,
  showSwarmStacks,
}: {
  templates?: TemplateViewModel[];
  onSelect: (template: TemplateViewModel) => void;
  selectedId?: TemplateViewModel['Id'];
  showSwarmStacks?: boolean;
}) {
  const fetchTemplateInfoMutation = useFetchTemplateInfoMutation();
  const router = useRouter();
  const [page, setPage] = useState(0);

  const listState = useTableState(store, tableKey);
  const filteredTemplates = useSortAndFilterTemplates(
    templates || [],
    listState,
    showSwarmStacks
  );

  const pagedTemplates =
    _.chunk(filteredTemplates, listState.pageSize)[page] || [];

  return (
    <Table.Container>
      <DatatableHeader
        onSearchChange={handleSearchChange}
        searchValue={listState.search}
        title="Templates"
        titleIcon={Edit}
        description={
          <Filters
            listState={listState}
            templates={templates || []}
            onChange={() => setPage(0)}
          />
        }
      />

      <div className="blocklist gap-y-2 !px-[20px] !pb-[20px]">
        {pagedTemplates.map((template) => (
          <AppTemplatesListItem
            key={template.Id}
            template={template}
            onSelect={onSelect}
            onDuplicate={onDuplicate}
            isSelected={selectedId === template.Id}
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

  function handleSearchChange(search: string) {
    listState.setSearch(search);
    setPage(0);
  }

  function onDuplicate(template: TemplateViewModel) {
    fetchTemplateInfoMutation.mutate(template, {
      onSuccess({ fileContent, type }) {
        router.stateService.go('.custom.new', {
          fileContent,
          type,
        });
      },
    });
  }
}
