import { truncate } from '@/portainer/filters/filters';

import { Link } from '@@/Link';
import { Badge } from '@@/Badge';

import { columnHelper } from './helper';

export const name = columnHelper.accessor('Name', {
  header: 'Name',
  id: 'name',
  cell({ row: { original: item } }) {
    return (
      <>
        <Link
          to=".network"
          params={{ id: item.Id, nodeName: item.NodeName }}
          title={item.Name}
          data-cy={`network-link-${item.Name}`}
        >
          {truncate(item.Name, 40)}
        </Link>
        {item.ResourceControl?.System && (
          <Badge type="info" className="ml-2">
            System
          </Badge>
        )}
      </>
    );
  },
});
