import { PropsWithChildren, useMemo, useReducer } from 'react';

import { EnvironmentId } from '@/portainer/environments/types';

import { createRowContext } from '@@/datatables/RowContext';

interface RowContextState {
  environmentId: EnvironmentId;
  isLoading: boolean;
  toggleIsLoading(): void;
}

const { RowProvider: InternalProvider, useRowContext } =
  createRowContext<RowContextState>();

export { useRowContext };

interface Props {
  environmentId: EnvironmentId;
}

export function RowProvider({
  environmentId,
  children,
}: PropsWithChildren<Props>) {
  const [isLoading, toggleIsLoading] = useReducer((state) => !state, false);

  const context = useMemo(
    () => ({
      isLoading,
      toggleIsLoading,
      environmentId,
    }),
    [environmentId, isLoading]
  );

  return <InternalProvider context={context}>{children}</InternalProvider>;
}
