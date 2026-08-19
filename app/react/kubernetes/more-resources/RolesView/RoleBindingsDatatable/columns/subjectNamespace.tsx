import { Link } from '@@/Link';
import { filterHOC } from '@@/datatables/Filter';

import {
  filterFn,
  filterNamespaceOptionsTransformer,
} from '../../../ClusterRolesView/utils';

import { columnHelper } from './helper';

export const subjectNamespace = columnHelper.accessor(
  (row) => row.subjects?.flatMap((sub) => sub.namespace || '-') || [],
  {
    header: 'Subject Namespace',
    id: 'subjectNamespace',
    cell: ({ row }) =>
      row.original.subjects?.map((sub, index) => (
        <div key={index}>
          {sub.namespace ? (
            <Link
              to="kubernetes.resourcePools.resourcePool"
              params={{
                id: sub.namespace,
              }}
              title={sub.namespace}
              data-cy={`subject-namespace-link-${row.original.name}_${index}`}
            >
              {sub.namespace}
            </Link>
          ) : (
            '-'
          )}
        </div>
      )) || '-',
    enableColumnFilter: true,
    // use a custom filter, to remove empty namespace values
    meta: {
      filter: filterHOC(
        'Filter by subject namespace',
        filterNamespaceOptionsTransformer
      ),
    },
    filterFn,
  }
);
