import { useCurrentStateAndParams, useRouter } from '@uirouter/react';

export function useParamState<T>(
  param: string,
  parseParam: (param: string | undefined) => T | undefined = (param) =>
    param as unknown as T
) {
  const {
    params: { [param]: paramValue },
  } = useCurrentStateAndParams();
  const router = useRouter();
  const state = parseParam(paramValue);

  return [
    state,
    (value?: T) => {
      router.stateService.go('.', { [param]: value }, { reload: false });
    },
  ] as const;
}
