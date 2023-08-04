import { columnHelper } from './helper';

export const image = columnHelper.accessor('image', {
  header: 'Image',
  cell: ({
    row: {
      original: { image },
    },
  }) => (
    <div className="max-w-xs truncate" title={image}>
      {image}
    </div>
  ),
});
