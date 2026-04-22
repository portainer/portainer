export const workflowQueryKeys = {
  all: ['gitops', 'workflows'] as const,
  list: (params: object) => [...workflowQueryKeys.all, 'list', params] as const,
  summary: () => [...workflowQueryKeys.all, 'summary'] as const,
};
