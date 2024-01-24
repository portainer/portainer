import { CellContext } from '@tanstack/react-table';

import { DockerImage } from '@/react/docker/images/types';

import { columnHelper } from './helper';

export const tags = columnHelper.accessor('RepoTags', {
  id: 'tags',
  header: 'Tags',
  cell: Cell,
});

function Cell({ getValue }: CellContext<DockerImage, string[]>) {
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
