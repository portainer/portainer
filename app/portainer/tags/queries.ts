import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { createTag, getTags } from './tags.service';
import { Tag, TagId } from './types';

export const tagKeys = {
  all: ['tags'] as const,
  tag: (id: TagId) => [...tagKeys.all, id] as const,
};

export function useTags<T = Tag[]>({
  select,
  enabled = true,
}: { select?: (tags: Tag[]) => T; enabled?: boolean } = {}) {
  return useQuery(tagKeys.all, () => getTags(), {
    staleTime: 50,
    select,
    enabled,
    ...withError('Failed to retrieve tags'),
  });
}

export function useTagsForEnvironment(environmentId: EnvironmentId) {
  const { data: tags, isLoading } = useTags({
    select: (tags) => tags.filter((tag) => tag.Endpoints[environmentId]),
  });

  return { tags, isLoading };
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
