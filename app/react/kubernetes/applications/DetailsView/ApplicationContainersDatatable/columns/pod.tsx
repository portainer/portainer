import { columnHelper } from './helper';

export const pod = columnHelper.accessor('podName', {
  header: 'Pod',
  cell: ({ getValue }) => (
    <div className="max-w-xs truncate" title={getValue()}>
      {getValue()}
    </div>
  ),
});
