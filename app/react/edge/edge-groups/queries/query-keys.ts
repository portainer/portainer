export const queryKeys = {
  base: () => ['edge', 'groups'] as const,
  item: (id: number) => [...queryKeys.base(), id] as const,
};
