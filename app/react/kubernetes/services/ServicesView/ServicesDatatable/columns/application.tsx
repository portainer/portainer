import { CellContext } from '@tanstack/react-table';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Link } from '@@/Link';

import { Service } from '../../../types';

import { columnHelper } from './helper';

export const application = columnHelper.accessor(
  (row) => (row.Applications ? row.Applications[0].Name : ''),
  {
    header: 'Application',
    id: 'application',
    cell: Cell,
  }
);

function Cell({ row, getValue }: CellContext<Service, string>) {
  const appName = getValue();
  const environmentId = useEnvironmentId();

  return appName ? (
    <Link
      to="kubernetes.applications.application"
      params={{
        endpointId: environmentId,
        namespace: row.original.Namespace,
        name: appName,
      }}
      title={appName}
    >
      {appName}
    </Link>
  ) : (
    '-'
  );
}
