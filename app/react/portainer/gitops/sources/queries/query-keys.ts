export const sourceQueryKeys = {
  all: ['gitops', 'sources'] as const,
  list: (params: object) => [...sourceQueryKeys.all, 'list', params] as const,
  summary: () => [...sourceQueryKeys.all, 'summary'] as const,
  detail: (id: number) => [...sourceQueryKeys.all, 'detail', id] as const,
  workflows: (id: number) =>
    [...sourceQueryKeys.detail(id), 'workflows'] as const,
};
