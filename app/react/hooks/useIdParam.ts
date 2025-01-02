import { useCurrentStateAndParams } from '@uirouter/react';

export function useIdParam(param = 'id'): number {
  const { params } = useCurrentStateAndParams();

  const stringId = params[param];
  const id = parseInt(stringId, 10);
  if (!id || Number.isNaN(id)) {
    throw new Error('id url param is required');
  }

  return id;
}
