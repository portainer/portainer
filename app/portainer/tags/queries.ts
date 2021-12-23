import { useEffect } from 'react';
import { useQuery } from 'react-query';

import { error as notifyError } from '@/portainer/services/notifications';

import { getTags } from './tags.service';
import { Tag } from './types';

export function useTags<T = Tag>(select?: (tags: Tag[]) => T[]) {
  const { data, isError, error, isLoading } = useQuery(
    'tags',
    () => getTags(),
    {
      staleTime: 50,
      select,
    }
  );

  useEffect(() => {
    if (isError) {
      notifyError('Failed loading tags', error as Error);
    }
  }, [isError, error]);

  return { tags: data, isLoading };
}
