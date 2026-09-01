import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import {
  getLogForgeStatus,
  installOrRegisterLogForge,
  uninstallOrClearLogForge,
} from './logforge.service';

export const logForgeQueryKeys = {
  base: () => ['logforge'] as const,
  status: () => [...logForgeQueryKeys.base(), 'status'] as const,
};

export function useLogForgeStatus() {
  return useQuery(logForgeQueryKeys.status(), getLogForgeStatus, {
    staleTime: 5000,
    refetchInterval: 30000,
    ...withError('Unable to retrieve LogForge status'),
  });
}

export function useInstallOrRegisterLogForgeMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    installOrRegisterLogForge,
    mutationOptions(
      withInvalidate(queryClient, [logForgeQueryKeys.status()]),
      withError('Unable to configure LogForge')
    )
  );
}

export function useUninstallOrClearLogForgeMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    uninstallOrClearLogForge,
    mutationOptions(
      withInvalidate(queryClient, [logForgeQueryKeys.status()]),
      withError('Unable to clear LogForge configuration')
    )
  );
}
