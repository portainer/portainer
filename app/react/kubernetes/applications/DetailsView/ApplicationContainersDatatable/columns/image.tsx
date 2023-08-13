import { columnHelper } from './helper';

export const image = columnHelper.accessor('image', {
  header: 'Image',
  cell: ({ getValue }) => (
    <div className="max-w-xs truncate" title={getValue()}>
      {getValue()}
    </div>
  ),
});
