export const sourceQueryKeys = {
  all: ['gitops', 'sources'] as const,
  list: (params: object) => [...sourceQueryKeys.all, 'list', params] as const,
  summary: () => [...sourceQueryKeys.all, 'summary'] as const,
};
