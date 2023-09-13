import { CellContext } from '@tanstack/react-table';

import { ImagesListResponse } from '@/react/docker/images/queries/useImages';

import { columnHelper } from './helper';

export const tags = columnHelper.accessor('tags', {
  id: 'tags',
  header: 'Tags',
  cell: Cell,
});

function Cell({ getValue }: CellContext<ImagesListResponse, string[]>) {
  const repoTags = getValue();

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
