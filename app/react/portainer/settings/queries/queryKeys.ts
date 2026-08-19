export const queryKeys = {
  base: () => ['settings'] as const,
  public: () => [...queryKeys.base(), 'public'] as const,
  experimental: () => [...queryKeys.base(), 'experimental'] as const,
};
