/** Kubernetes environment base query keys */
export const queryKeys = {
  base: (environmentId: number) =>
    ['environments', environmentId, 'kubernetes'] as const,
};
