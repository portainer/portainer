import { Row } from '@tanstack/react-table';

import { RoleBinding } from '../RolesView/RoleBindingsDatatable/types';

import { ClusterRoleBinding } from './ClusterRoleBindingsDatatable/types';

/**
 * Transforms the rows of a table to get a unique list of namespaces to use as filter options.
 * One row can have multiple subject namespaces.
 * @param rows - The rows of the table.
 * @param id - The ID of the column containing the subject namespaces.
 * @returns An array of unique subject namespace options.
 */
export function filterNamespaceOptionsTransformer<
  TData extends ClusterRoleBinding | RoleBinding,
>(rows: Row<TData>[], id: string) {
  const options = new Set<string>();
  rows.forEach(({ getValue }) => {
    const value = getValue<string[]>(id);
    if (!value) {
      return;
    }
    value.forEach((v) => {
      if (v && v !== '-') {
        options.add(v);
      }
    });
  });
  return Array.from(options);
}

/**
 * Filters the rows of a table based on the selected namespaces.
 * @param row - The row to filter.
 * @param _columnId - The ID of the column being filtered.
 * @param filterValue - The selected namespaces to filter by.
 * @returns True if the row should be shown, false otherwise.
 */
export function filterFn(
  row: Row<ClusterRoleBinding | RoleBinding>,
  _columnId: string,
  filterValue: string[]
) {
  // when no filter is set, show all rows
  if (filterValue.length === 0) {
    return true;
  }
  const subjectNamespaces = row.original.subjects?.flatMap(
    (sub) => sub.namespace ?? []
  );
  return filterValue.some((v) => subjectNamespaces?.includes(v));
}
