import { CellContext } from '@tanstack/react-table';

import { ImagesListResponse } from '@/react/docker/images/queries/useImages';

import { Badge } from '@@/Badge';
import { Tooltip } from '@@/Tip/Tooltip/Tooltip';

import { columnHelper } from './helper';

export const tags = columnHelper.accessor(
  (item) => (isDangling(item.tags) ? 'Dangling' : item.tags?.join(',')),
  {
    id: 'tags',
    header: 'Tags',
    cell: Cell,
  }
);

function Cell({
  row: { original: item },
}: CellContext<ImagesListResponse, unknown>) {
  const repoTags = item.tags;
  const isDanglingImage = isDangling(repoTags);

  if (isDanglingImage) {
    return (
      <Badge type="muted">
        Dangling
        <Tooltip message="Dangling images are untagged and no longer referenced by any repository." />
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {repoTags?.map((tag, idx) => (
        <Badge key={idx} type="info">
          {tag}
        </Badge>
      ))}
    </div>
  );
}

function isDangling(tags?: string[]) {
  return !tags || tags.length === 0;
}
