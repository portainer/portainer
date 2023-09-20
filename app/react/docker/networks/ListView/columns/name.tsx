import { truncate } from '@/portainer/filters/filters';

import { Link } from '@@/Link';

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
        >
          {truncate(item.Name, 40)}
        </Link>
        {item.ResourceControl?.System && (
          <span
            style={{ marginLeft: '10px' }}
            className="label label-info image-tag space-left"
          >
            System
          </span>
        )}
      </>
    );
  },
});
