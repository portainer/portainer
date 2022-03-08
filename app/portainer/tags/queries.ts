import { useQuery } from 'react-query';

import { error as notifyError } from '@/portainer/services/notifications';

import { getTags } from './tags.service';
import { Tag } from './types';

export function useTags<T = Tag>(select?: (tags: Tag[]) => T[]) {
  const { data, isLoading } = useQuery('tags', () => getTags(), {
    staleTime: 50,
    select,
    onError(error) {
      notifyError('Failed loading tags', error as Error);
    },
  });

  return { tags: data, isLoading };
}
