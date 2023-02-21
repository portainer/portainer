import { CellProps, Column } from 'react-table';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Link } from '@@/Link';

import { Service } from '../../types';

export const application: Column<Service> = {
  Header: 'Application',
  accessor: (row) => (row.Applications ? row.Applications[0].Name : ''),
  id: 'application',

  Cell: ({ row, value: appname }: CellProps<Service, string>) => {
    const environmentId = useEnvironmentId();
    return appname ? (
      <Link
        to="kubernetes.applications.application"
        params={{
          endpointId: environmentId,
          namespace: row.original.Namespace,
          name: appname,
        }}
        title={appname}
      >
        {appname}
      </Link>
    ) : (
      '-'
    );
  },
  canHide: true,
  disableFilters: true,
};
