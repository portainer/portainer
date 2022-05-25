import { useMutation, useQuery, useQueryClient } from 'react-query';

import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { createTag, getTags } from './tags.service';
import { Tag, TagId } from './types';

const tagKeys = {
  all: ['tags'] as const,
  tag: (id: TagId) => [...tagKeys.all, id] as const,
};

export function useTags<T = Tag>(select?: (tags: Tag[]) => T[]) {
  const { data, isLoading } = useQuery(tagKeys.all, () => getTags(), {
    staleTime: 50,
    select,
    ...withError('Failed to retrieve tags'),
  });

  return { tags: data, isLoading };
}

export function useCreateTagMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    createTag,
    mutationOptions(
      withError('Unable to create tag'),
      withInvalidate(queryClient, [tagKeys.all])
    )
  );
}
