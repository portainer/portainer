import { CellContext } from '@tanstack/react-table';

import { DockerImage } from '@/react/docker/images/types';

import { columnHelper } from './helper';

export const tags = columnHelper.accessor((item) => item.RepoTags.join(','), {
  id: 'tags',
  header: 'Tags',
  cell: Cell,
});

function Cell({ row: { original: item } }: CellContext<DockerImage, unknown>) {
  const repoTags = item.RepoTags;

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
