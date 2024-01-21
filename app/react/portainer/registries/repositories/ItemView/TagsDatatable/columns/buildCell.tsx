import { CellContext } from '@tanstack/react-table';
import { useCurrentStateAndParams } from '@uirouter/react';

import { useTagDetails } from '../../../queries/useTagDetails';
import { Tag } from '../types';
import { RepositoryTagViewModel } from '../view-model';

function useParams() {
  const {
    params: { endpointId, id, repository },
  } = useCurrentStateAndParams();

  const registryId = number(id);

  if (!registryId) {
    throw new Error('Missing registry id');
  }

  if (!repository || typeof repository !== 'string') {
    throw new Error('Missing repository name');
  }

  return {
    environmentId: number(endpointId),
    registryId,
    repository,
  };
}

export function useDetails<T = RepositoryTagViewModel>(
  tag: string,
  select?: (data: RepositoryTagViewModel) => T
) {
  const params = useParams();
  return useTagDetails(
    {
      tag,
      ...params,
    },
    { staleTime: 60 * 1000, select }
  );
}

export function buildCell<T = RepositoryTagViewModel>(
  select: (data: RepositoryTagViewModel) => T
) {
  return function Cell({ row }: CellContext<Tag, unknown>) {
    const detailsQuery = useDetails(row.original.Name, select);

    return detailsQuery.data || '';
  };
}

function number(value: string | undefined) {
  const num = parseInt(value || '', 10);
  return Number.isNaN(num) ? undefined : num;
}
