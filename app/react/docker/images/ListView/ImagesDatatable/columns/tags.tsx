import { CellContext } from '@tanstack/react-table';

import { ImagesListResponse } from '@/react/docker/images/queries/useImages';

import { columnHelper } from './helper';

export const tags = columnHelper.accessor((item) => item.tags.join(','), {
  id: 'tags',
  header: 'Tags',
  cell: Cell,
});

function Cell({
  row: { original: item },
}: CellContext<ImagesListResponse, unknown>) {
  const repoTags = item.tags;

  return (
    <>
      {repoTags.map((tag, idx) => (
        <span key={idx} className="label label-primary image-tag" title={tag}>
          {tag}
        </span>
      ))}
    </>
  );
}
