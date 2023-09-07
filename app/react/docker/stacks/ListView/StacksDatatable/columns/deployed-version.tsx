import { isExternalStack } from '@/react/docker/stacks/view-models/utils';

import { columnHelper } from './helper';

export const deployedVersion = columnHelper.accessor(
  (item) => {
    if (isExternalStack(item)) {
      return '';
    }

    return item.GitConfig ? item.GitConfig.ConfigHash : item.StackFileVersion;
  },
  {
    header: 'Deployed Version',
    id: 'deployed-version',
    cell: ({ row: { original: item } }) => {
      if (isExternalStack(item)) {
        return <div className="text-center">-</div>;
      }

      if (item.GitConfig) {
        return (
          <div className="text-center">
            <a
              target="_blank"
              href={`${item.GitConfig.URL}/commit/${item.GitConfig.ConfigHash}`}
              rel="noreferrer"
            >
              {item.GitConfig.ConfigHash.slice(0, 7)}
            </a>
          </div>
        );
      }

      return <div className="text-center">{item.StackFileVersion || '-'}</div>;
    },
    meta: {
      className: '[&>*]:justify-center',
    },
  }
);
