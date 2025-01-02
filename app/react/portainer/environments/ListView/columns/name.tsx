import { EnvironmentStatus } from '@/react/portainer/environments/types';

import { Link } from '@@/Link';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Name', {
  header: 'Name',
  cell: ({ getValue, row: { original: environment } }) => {
    const name = getValue();
    if (environment.Status === EnvironmentStatus.Provisioning) {
      return name;
    }

    return (
      <Link
        to="portainer.endpoints.endpoint"
        params={{ id: environment.Id }}
        data-cy={`environment-link-${environment.Id}`}
      >
        {name}
      </Link>
    );
  },
});
