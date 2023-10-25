import _ from 'lodash';

import { Option, PortainerSelect } from '@@/form-components/PortainerSelect';

import { ListState, TemplateType } from './types';
import { TemplateViewModel } from './view-model';
import { TemplateListSort } from './TemplateListSort';

const orderByFields = ['Title', 'Categories', 'Description'] as const;
const typeFilters: ReadonlyArray<Option<TemplateType>> = [
  { label: 'Container', value: TemplateType.Container },
  { label: 'Swarm Stack', value: TemplateType.SwarmStack },
  { label: 'Compose Stack', value: TemplateType.ComposeStack },
] as const;

export function Filters({
  templates,
  listState,
  onChange,
  disabledTypes = [],
  fixedCategories = [],
}: {
  templates: TemplateViewModel[];
  listState: ListState & { search: string };
  onChange(): void;
  disabledTypes?: Array<TemplateType>;
  fixedCategories?: Array<string>;
}) {
  const categories = _.sortBy(
    _.uniq(templates?.flatMap((template) => template.Categories))
  )
    .filter((category) => !fixedCategories.includes(category))
    .map((category) => ({ label: category, value: category }));

  const typeFiltersEnabled =
    disabledTypes.length > 0
      ? typeFilters.map((type) => ({
          ...type,
          disabled: disabledTypes.includes(type.value),
        }))
      : typeFilters;

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
        <PortainerSelect<TemplateType>
          isMulti
          options={typeFiltersEnabled}
          onChange={(types) => {
            listState.setTypes(types);
            onChange();
          }}
          placeholder="Type"
          value={listState.types}
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
