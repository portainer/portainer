import { useCallback, useMemo } from 'react';

import { TemplateViewModel } from './view-model';
import { ListState, TemplateType } from './types';

export function useSortAndFilterTemplates(
  templates: Array<TemplateViewModel>,
  listState: ListState & { search: string },
  showSwarmStacks?: boolean
) {
  const filterByCategory = useCallback(
    (item: TemplateViewModel) => {
      if (!listState.category) {
        return true;
      }

      return item.Categories.includes(listState.category);
    },
    [listState.category]
  );

  const filterBySearch = useCallback(
    (item: TemplateViewModel) =>
      item.Title.includes(listState.search) ||
      item.Description.includes(listState.search) ||
      item.Categories.includes(listState.search) ||
      item.Note?.includes(listState.search),
    [listState.search]
  );

  const filterByTemplateType = useCallback(
    (item: TemplateViewModel) => {
      switch (item.Type) {
        case TemplateType.Container:
          return (
            listState.type === TemplateType.Container || listState.type === null
          );
        case TemplateType.SwarmStack:
          return (
            showSwarmStacks &&
            (listState.type === TemplateType.SwarmStack ||
              listState.type === null)
          );
        case TemplateType.ComposeStack:
          return (
            listState.type === TemplateType.SwarmStack ||
            listState.type === null
          );
        case TemplateType.EdgeStack:
          return listState.type === TemplateType.EdgeStack;
        default:
          return false;
      }
    },
    [listState.type, showSwarmStacks]
  );

  const sort = useCallback(
    (a: TemplateViewModel, b: TemplateViewModel) => {
      const sortMultiplier = listState.sortBy?.desc ? -1 : 1;
      switch (listState.sortBy?.id) {
        case 'Categories':
          return sortByCategories(a.Categories, b.Categories) * sortMultiplier;
        case 'Description':
          return a.Description.localeCompare(b.Description) * sortMultiplier;
        case 'Title':
        default:
          return a.Title.localeCompare(b.Title) * sortMultiplier;
      }
    },

    [listState.sortBy?.desc, listState.sortBy?.id]
  );

  return useMemo(
    () =>
      templates
        ?.filter(filterByTemplateType)
        .filter(filterByCategory)
        .filter(filterBySearch)
        .sort(sort) || [],
    [templates, filterByTemplateType, filterByCategory, filterBySearch, sort]
  );
}

function sortByCategories(a: Array<string>, b: Array<string>): number {
  if (a.length === 0 && b.length === 0) {
    return 0;
  }
  if (a.length === 0) {
    return -1;
  }
  if (b.length === 0) {
    return 1;
  }

  const aCategory = a[0];
  const bCategory = b[0];

  return (
    aCategory.localeCompare(bCategory) ||
    sortByCategories(a.slice(1), b.slice(1))
  );
}
