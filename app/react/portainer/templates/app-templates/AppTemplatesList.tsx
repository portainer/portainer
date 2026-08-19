import { Edit } from 'lucide-react';
import _ from 'lodash';
import { useMemo, useState } from 'react';

import { DatatableHeader } from '@@/datatables/DatatableHeader';
import { Table } from '@@/datatables';
import { useTableState } from '@@/datatables/useTableState';
import { createPersistedStore } from '@@/datatables/types';
import { DatatableFooter } from '@@/datatables/DatatableFooter';

import { AppTemplatesListItem } from './AppTemplatesListItem';
import { TemplateViewModel } from './view-model';
import { ListState, TemplateType } from './types';
import { useSortAndFilterTemplates } from './useSortAndFilter';
import { Filters } from './Filters';

export function AppTemplatesList({
  templates: initialTemplates,
  onSelect,
  selectedId,
  disabledTypes,
  fixedCategories,
  storageKey,
  templateLinkParams,
}: {
  storageKey: string;
  templates?: TemplateViewModel[];
  onSelect?: (template: TemplateViewModel) => void;
  selectedId?: TemplateViewModel['Id'];
  disabledTypes?: Array<TemplateType>;
  fixedCategories?: Array<string>;
  templateLinkParams?: (template: TemplateViewModel) => {
    to: string;
    params: object;
  };
}) {
  const [page, setPage] = useState(0);
  const [store] = useState(() =>
    createPersistedStore<ListState>(storageKey, undefined, (set) => ({
      category: null,
      setCategory: (category: ListState['category']) => set({ category }),
      types: [],
      setTypes: (types: ListState['types']) => set({ types }),
    }))
  );
  const listState = useTableState(store, storageKey);

  const templates = useMemo(() => {
    if (!initialTemplates) {
      return [];
    }

    if (!fixedCategories?.length) {
      return initialTemplates;
    }

    return initialTemplates.filter((template) =>
      fixedCategories.some((category) => template.Categories.includes(category))
    );
  }, [fixedCategories, initialTemplates]);

  const filteredTemplates = useSortAndFilterTemplates(
    templates || [],
    listState,
    disabledTypes
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
            disabledTypes={disabledTypes}
            fixedCategories={fixedCategories}
          />
        }
        data-cy="app-templates-list-header"
      />

      <div className="blocklist gap-y-2 !px-[20px] !pb-[20px]" role="list">
        {pagedTemplates.map((template) => (
          <AppTemplatesListItem
            key={template.Id}
            template={template}
            onSelect={onSelect}
            isSelected={selectedId === template.Id}
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

  function handleSearchChange(search: string) {
    listState.setSearch(search);
    setPage(0);
  }
}
