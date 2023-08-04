import { columnHelper } from './helper';

export const pod = columnHelper.accessor('podName', {
  header: 'Pod',
  cell: ({
    row: {
      original: { podName },
    },
  }) => (
    <div className="max-w-xs truncate" title={podName}>
      {podName}
    </div>
  ),
});
