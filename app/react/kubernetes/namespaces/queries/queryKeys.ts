export const queryKeys = {
  list: (
    environmentId: number,
    { withResourceQuota }: { withResourceQuota: boolean }
  ) => [
    'environments',
    environmentId,
    'kubernetes',
    'namespaces',
    { withResourceQuota },
  ],
};
