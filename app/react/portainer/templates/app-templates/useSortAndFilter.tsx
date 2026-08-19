import { useCallback, useMemo } from 'react';
import _ from 'lodash';

import { TemplateViewModel } from './view-model';
import { ListState } from './types';

export function useSortAndFilterTemplates(
  templates: Array<TemplateViewModel>,
  listState: ListState & { search: string },
  disabledTypes: Array<TemplateViewModel['Type']> = []
) {
  const filterByCategory = useCallback(
    (item: TemplateViewModel) => {
      if (!listState.category) {
        return true;
      }

      return _.compact([listState.category]).every((category) =>
        item.Categories.includes(category)
      );
    },
    [listState.category]
  );

  const filterBySearch = useCallback(
    (item: TemplateViewModel) => {
      const search = listState.search.toLowerCase();
      return (
        item.Title.toLowerCase().includes(search) ||
        item.Description.toLowerCase().includes(search) ||
        item.Categories.some((category) =>
          category.toLowerCase().includes(search)
        ) ||
        item.Note?.toLowerCase().includes(search) ||
        item.Name?.toLowerCase().includes(search)
      );
    },
    [listState.search]
  );

  const filterByTemplateType = useCallback(
    (item: TemplateViewModel) => {
      if (listState.types.length === 0 && disabledTypes.length === 0) {
        return true;
      }

      if (listState.types.length === 0) {
        return !disabledTypes.includes(item.Type);
      }

      return (
        listState.types.includes(item.Type) &&
        !disabledTypes.includes(item.Type)
      );
    },
    [disabledTypes, listState.types]
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
