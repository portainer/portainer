import _ from 'lodash';

import { PortainerSelect } from '@@/form-components/PortainerSelect';

import { ListState, TemplateType } from './types';
import { TemplateViewModel } from './view-model';
import { TemplateListSort } from './TemplateListSort';

const orderByFields = ['Title', 'Categories', 'Description'] as const;
const typeFilters = [
  { label: 'Container', value: TemplateType.Container },
  { label: 'Stack', value: TemplateType.SwarmStack },
] as const;

export function Filters({
  templates,
  listState,
  onChange,
}: {
  templates: TemplateViewModel[];
  listState: ListState & { search: string };
  onChange(): void;
}) {
  const categories = _.sortBy(
    _.uniq(templates?.flatMap((template) => template.Categories))
  ).map((category) => ({ label: category, value: category }));

  return (
    <div className="flex gap-4 w-full">
      <div className="w-1/4">
        <PortainerSelect
          options={categories}
          onChange={(category) => {
            listState.setCategory(category);
            onChange();
          }}
          placeholder="Category"
          value={listState.category}
          bindToBody
          isClearable
        />
      </div>
      <div className="w-1/4">
        <PortainerSelect
          options={typeFilters}
          onChange={(type) => {
            listState.setType(type);
            onChange();
          }}
          placeholder="Type"
          value={listState.type}
          bindToBody
          isClearable
        />
      </div>
      <div className="w-1/4 ml-auto">
        <TemplateListSort
          onChange={(value) => {
            listState.setSortBy(value?.id, value?.desc ?? false);
            onChange();
          }}
          options={orderByFields}
          placeholder="Sort By"
          value={listState.sortBy}
        />
      </div>
    </div>
  );
}
